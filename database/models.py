from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, BigInteger, Numeric, String, Text, JSON, func, Computed, Float

from sqlalchemy.dialects.postgresql import ARRAY

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    #Done
    email: Mapped[str] = mapped_column(String(255), primary_key=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[str] = mapped_column(String(100), nullable=False)

    dob: Mapped[date | None] = mapped_column(Date)

    phone_personal: Mapped[str | None] = mapped_column(String(20))

    phone_business: Mapped[str | None] = mapped_column(String(20))

    regions: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    department: Mapped[str] = mapped_column(String(50), default="General")

    quarterly_order_value_target: Mapped[int] = mapped_column(Integer, default=0)


    # Relationships
    activity_logs: Mapped[list["ActivityLog"]] = relationship(back_populates="operator", passive_deletes=True)

    dispatch_records: Mapped[list["DispatchRecord"]] = relationship(back_populates="operator", passive_deletes=True)

    grn_headers: Mapped[list["GRNHeader"]] = relationship(back_populates="operator", passive_deletes=True)

class ActivityLog(Base):
    #Done
    __tablename__ = "activity_logs"

    log_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False,)

    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)

    operator_email: Mapped[str | None] = mapped_column(ForeignKey("users.email", ondelete="SET NULL",))

    log_type: Mapped[str] = mapped_column(String(50), default="COMMENT",)

    message: Mapped[str] = mapped_column(Text, nullable=False)

    meta_data: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    operator: Mapped["User | None"] = relationship(back_populates="activity_logs")

class OrderHeader(Base):
    __tablename__ = "order_headers"
    #Done
    order_acceptance_id: Mapped[str] = mapped_column(String(50), primary_key=True)

    order_acceptance_date: Mapped[date]

    purchase_order_number: Mapped[str] = mapped_column(String(100))

    purchase_order_date: Mapped[date]

    customer_code: Mapped[str] = mapped_column(String(50))

    payment_terms: Mapped[str | None] = mapped_column(String(100))

    billing_name: Mapped[str] = mapped_column(String(255))

    billing_address: Mapped[str] = mapped_column(Text)

    dispatched_through: Mapped[str | None] = mapped_column(String(100))

    delivery_terms: Mapped[str | None] = mapped_column(String(100))

    due_date: Mapped[date]

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    production_stage: Mapped[str] = mapped_column(String(50), default="PO_SUBMITTED")

    ordered_by: Mapped[str | None] = mapped_column(String(255))

    packing_charges: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)

    freight_charges: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)

    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=18)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")

    bills: Mapped[list["BillHeader"]] = relationship(back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    #Done
    order_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    order_acceptance_id: Mapped[str] = mapped_column(ForeignKey("order_headers.order_acceptance_id",ondelete="CASCADE"))

    item_code: Mapped[str] = mapped_column(ForeignKey("items_master.item_code"))

    um: Mapped[str | None] = mapped_column(String(10))

    additional_spec_text: Mapped[str | None] = mapped_column(Text)

    hsn_code: Mapped[str] = mapped_column(String(8))

    quantity: Mapped[int] = mapped_column(Integer)

    rate: Mapped[Decimal] = mapped_column(Numeric(15, 4))

    discount_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2),default=0,)

    amount: Mapped[Decimal]  = mapped_column(Numeric(15, 2), Computed("quantity * rate * (1 - discount_percentage / 100)"))

    order: Mapped["OrderHeader"] = relationship(back_populates="items")

    item: Mapped["ItemMaster"] = relationship(back_populates="order_items")

    bill_items: Mapped[list["BillItem"]] = relationship(back_populates="order_item")

class BillHeader(Base):
    #Done
    __tablename__ = "bill_headers"

    bill_num: Mapped[str] = mapped_column(String(50), primary_key=True,)

    bill_date: Mapped[date]

    order_acceptance_id: Mapped[str | None] = mapped_column(ForeignKey("order_headers.order_acceptance_id"))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(),)

    order: Mapped["OrderHeader | None"] = relationship(back_populates="bills")

    items: Mapped[list["BillItem"]] = relationship(back_populates="bill", cascade="all, delete-orphan",)

class BillItem(Base):
    __tablename__ = "bill_items"
    #Done
    bill_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    bill_num: Mapped[str] = mapped_column(ForeignKey("bill_headers.bill_num",ondelete="CASCADE",))

    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.order_item_id"), nullable=True)

    quantity_shipped: Mapped[int]

    item_code: Mapped[str | None] = mapped_column(ForeignKey("items_master.item_code"), nullable=True)

    product_name: Mapped[str | None] = mapped_column(String(255))

    hsn_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    rate: Mapped[float | None]

    amount: Mapped[float | None]
    
    bill: Mapped["BillHeader"] = relationship(back_populates="items")

    order_item: Mapped["OrderItem"] = relationship(back_populates="bill_items")

    item = relationship("ItemMaster")
class ItemMaster(Base):
    __tablename__ = "items_master"
    #Done
    item_code: Mapped[str] = mapped_column(String(100), primary_key=True,)

    item_name: Mapped[str] = mapped_column(String(255))

    item_group: Mapped[str | None] = mapped_column(String(100))

    rate: Mapped[Decimal] = mapped_column(Numeric(15, 2),default=0.00,)

    unit_measure: Mapped[str] = mapped_column(String(20),default="NOS",)

    created_at: Mapped[datetime] = mapped_column(DateTime,server_default=func.now(),)

    is_active: Mapped[bool] = mapped_column(Boolean,default=True,)

    additional_spec_text: Mapped[str | None] = mapped_column(Text)

    hsn_code: Mapped[str | None] = mapped_column(String(20))

    revision_no: Mapped[str] = mapped_column(String(50), default="",)

    available_stock: Mapped[int] = mapped_column(default=0)

    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="item")

class StagingOrderHeader(Base):
    __tablename__ = "stg_order_headers"
    #Done
    staging_id: Mapped[int] = mapped_column(Integer,primary_key=True)

    order_acceptance_id: Mapped[str | None] = mapped_column(String(100), unique=True)

    order_acceptance_date: Mapped[date | None] = mapped_column(Date)

    purchase_order_number: Mapped[str | None] = mapped_column(String(100))

    purchase_order_date: Mapped [date | None] = mapped_column(Date)
    
    billing_name: Mapped[str | None] = mapped_column(String(100))

    billing_address: Mapped[str | None] = mapped_column(Text)

    payment_terms: Mapped[str | None] = mapped_column(String(255))

    status: Mapped[str] = mapped_column(String(50),default="PENDING")

    created_at: Mapped[datetime] = mapped_column(DateTime,server_default=func.now())
    
    due_date: Mapped[date | None] = mapped_column(Date)
    
    items: Mapped[list["StagingOrderItem"]] = relationship(primaryjoin="foreign(StagingOrderItem.order_acceptance_id)==StagingOrderHeader.order_acceptance_id",cascade="all, delete-orphan",)

class StagingOrderItem(Base):
    __tablename__ = "stg_order_items"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True,)

    order_acceptance_id: Mapped[str | None] = mapped_column(ForeignKey("stg_order_headers.order_acceptance_id", ondelete="CASCADE"))

    item_code: Mapped[str | None] = mapped_column(String(150))

    additional_spec_text: Mapped[str | None] = mapped_column(Text)

    hsn_code: Mapped[str | None] = mapped_column(String(50))

    quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    rate: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))

    amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))

class LogisticsPartner(Base):
    __tablename__ = "logistics_partners"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    cft_factor: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=10,)

    minimum_weight: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0,)

    minimum_freight_value: Mapped[Decimal] = mapped_column(Numeric(10, 2),default=0)

    documentation_charge: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0,)

    fov_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2),default=0,)

    gst_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=18,)

    partner_link: Mapped[str | None] = mapped_column(String(500))

    local_loading_cost: Mapped[Decimal] = mapped_column(Numeric, default=0,)

    hub_loading_max_cost: Mapped[Decimal] = mapped_column(Numeric, default=0,)

    zones: Mapped[list["LogisticsZone"]] = relationship(back_populates="partner", cascade="all, delete-orphan")

    zone_rates: Mapped[list["LogisticsZoneRate"]] = relationship(back_populates="partner", cascade="all, delete-orphan")

    fuel_matrix: Mapped[list["LogisticsFuelMatrix"]] = relationship(back_populates="partner", cascade="all, delete-orphan")

    oda_matrix: Mapped[list["LogisticsODAMatrix"]] = relationship(back_populates="partner", cascade="all, delete-orphan")

class LogisticsZone(Base):
    __tablename__ = "logistics_zones"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    partner_id: Mapped[int] = mapped_column(ForeignKey("logistics_partners.id"), nullable=False)

    zone_code: Mapped[str] = mapped_column(String(10), nullable=False,)

    zone_name: Mapped[str | None] = mapped_column(String(255))

    states: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    sort_order: Mapped[int] = mapped_column(default=0)

    partner: Mapped["LogisticsPartner"] = relationship(back_populates="zones")

class LogisticsZoneRate(Base):
    __tablename__ = "logistics_zone_rates"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    partner_id: Mapped[int] = mapped_column(ForeignKey("logistics_partners.id"), nullable=False,)

    destination_zone: Mapped[str | None] = mapped_column(String(10))

    rate_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    sort_order: Mapped[int] = mapped_column(default=0)

    partner: Mapped["LogisticsPartner"] = relationship(back_populates="zone_rates")

class LogisticsFuelMatrix(Base):
    __tablename__ = "logistics_fuel_matrix"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    partner_id: Mapped[int | None] = mapped_column(ForeignKey("logistics_partners.id"))

    fuel_price_from: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    fuel_price_to: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    surcharge_percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))

    sort_order: Mapped[int] = mapped_column(default=0)

    partner: Mapped["LogisticsPartner"] = relationship(back_populates="fuel_matrix")

class LogisticsODAMatrix(Base):
    __tablename__ = "logistics_oda_matrix"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    partner_id: Mapped[int | None] = mapped_column(ForeignKey("logistics_partners.id"))

    km_from: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    km_to: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    weight_from: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    weight_to: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    oda_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    sort_order: Mapped[int] = mapped_column(default=0)

    partner: Mapped["LogisticsPartner"] = relationship(back_populates="oda_matrix")

class DispatchRecord(Base):
    __tablename__ = "dispatch_records"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    partner_name: Mapped[str | None] = mapped_column(String(255))

    destination_zone: Mapped[str | None] = mapped_column(String(10))

    chargeable_weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    basic_freight: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    fuel_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    fov_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    oda_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    hamali_detail: Mapped[str | None] = mapped_column(String(255))

    hamali_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    dispatch_cost_gst: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    operator_email: Mapped[str | None] = mapped_column(ForeignKey("users.email", ondelete="SET NULL",))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(),)

    loading_charge: Mapped[Decimal] = mapped_column(Numeric, default=0,)
    
    operator: Mapped["User | None"] = relationship(back_populates="dispatch_records")
class Task(Base):
    __tablename__ = "tasks"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    details: Mapped[str | None] = mapped_column(Text)

    direction: Mapped[str | None] = mapped_column(String(50))

    is_incomplete: Mapped[bool] = mapped_column(Boolean, default=True)

    assigned_by: Mapped[str | None] = mapped_column(ForeignKey("users.email"))

    assigned_to: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    attachment_urls: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    deadline: Mapped[datetime | None] = mapped_column(DateTime)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    creator: Mapped["User | None"] = relationship(foreign_keys=[assigned_by])

class CRMLead(Base):
    __tablename__ = "crm_leads"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    full_name: Mapped[str] = mapped_column(String(255))

    designation: Mapped[str | None] = mapped_column(String(100))

    company_name: Mapped[str | None] = mapped_column(String(255))

    contact_email: Mapped[str] = mapped_column(String(255))

    phone_number: Mapped[str | None] = mapped_column(String(50))

    city_state: Mapped[str] = mapped_column(String(255))

    product_query: Mapped[str | None]

    gdpr_consent: Mapped[bool] = mapped_column(Boolean,default=False)

    assigned_region: Mapped[str | None] = mapped_column(String(100))

    assigned_to: Mapped[str | None] = mapped_column(String(255))

    status: Mapped[str] = mapped_column(String(50), default="New")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class ClientCompany(Base):
    __tablename__ = "client_companies"
    #Done
    id: Mapped[str] = mapped_column(String(20), primary_key=True)

    name: Mapped[str] = mapped_column(String(255), unique=True)

    address_line_1: Mapped[str] = mapped_column(String(255))

    city: Mapped[str] = mapped_column(String(100))

    state: Mapped[str] = mapped_column(String(100))

    pincode: Mapped[str] = mapped_column(String(10))

    contact_name: Mapped[str] = mapped_column(String(255))

    contact_role: Mapped[str] = mapped_column(String(100))

    contact_phone: Mapped[str] = mapped_column(String(20))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class GRNHeader(Base):
    __tablename__ = "grn_headers"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    grn_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    vendor_name: Mapped[str | None] = mapped_column(String(255))

    receipt_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())

    operator_email: Mapped[str | None] = mapped_column(ForeignKey("users.email"))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    items: Mapped[list["GRNItem"]] = relationship(back_populates="grn",cascade="all, delete-orphan")

    operator: Mapped["User | None"] = relationship(back_populates="grn_headers")

class GRNItem(Base):
    __tablename__ = "grn_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    grn_id: Mapped[int | None] = mapped_column(
        ForeignKey("grn_headers.id", ondelete="CASCADE")
    )

    item_code: Mapped[str | None] = mapped_column(String(100),ForeignKey("test_items_master.item_code"))

    quantity: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2)
    )

    rate: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2)
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        Computed("quantity * rate")
    )

    grn: Mapped["GRNHeader"] = relationship(
        back_populates="items"
    )

    item: Mapped["TestItemMaster"] = relationship(
        back_populates="grn_items"
    )
class LeadTarget(Base):
    __tablename__ = "lead_targets"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    company_name: Mapped[str] = mapped_column(String(255))

    domain: Mapped[str] = mapped_column(String(255))

    requested_by: Mapped[str] = mapped_column(String(255))

    status: Mapped[str] = mapped_column(String(50), default="Pending")
    
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    gtm_source: Mapped[str] = mapped_column(String(100), default="Snov.io")

    email_status: Mapped[str] = mapped_column(String(50), default="Not Sent")

    added_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())

    cost_per_credit: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal("0.0"))

    emails_found: Mapped[int] = mapped_column(Integer, default=0)
    
    snovio_raw_data: Mapped[dict | None] = mapped_column(JSON)

    rejected_reason: Mapped[str] = mapped_column(String(50))

    contacts: Mapped[list["LeadContact"]] = relationship(back_populates="target", cascade="all, delete-orphan")
    
class LeadContact(Base):
    __tablename__ = "lead_contacts"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    target_id: Mapped[int] = mapped_column(ForeignKey("lead_targets.id", ondelete="CASCADE"))

    full_name: Mapped[str] = mapped_column(String(255))

    designation: Mapped[str | None] = mapped_column(String(255))

    email: Mapped[str | None] = mapped_column(String(255))

    phone: Mapped[str | None] = mapped_column(String(50))

    linkedin_url: Mapped[str | None] = mapped_column(String(500))

    is_priority: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    target: Mapped["LeadTarget"] = relationship(back_populates="contacts")

class FAQQuery(Base):
    __tablename__ = "faq_queries"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)

    question: Mapped[str] = mapped_column(Text)

    answer: Mapped[str | None] = mapped_column(Text)

    asked_by: Mapped[str] = mapped_column(String(255))

    answered_by: Mapped[str | None] = mapped_column(String(255))

    status: Mapped[str] = mapped_column(String(50), default="Pending")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_email: Mapped[str] = mapped_column(String(255), nullable=False)

    user_name: Mapped[str] = mapped_column(String(255), nullable=False)

    action_route: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class SystemErrorLog(Base):
    __tablename__ = "system_error_logs"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    route_path: Mapped[str | None] = mapped_column(String(255))

    error_message: Mapped[str | None] = mapped_column(Text)

    stack_trace: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class SystemNotification(Base):
    __tablename__ = "system_notifications"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_email: Mapped[str] = mapped_column(ForeignKey("users.email"), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    message: Mapped[str] = mapped_column(Text, nullable=False)

    type: Mapped[str] = mapped_column(String(50), nullable=False)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    
class TestItemMaster(Base):
    __tablename__ = "test_items_master"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    item_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    item_specification: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    grn_items: Mapped[list["GRNItem"]] = relationship(back_populates="item")

"""class StagingBillHeader(Base):
    __tablename__ = "staging_bill_headers"

    bill_num = mapped_column(String(50), primary_key=True)
    bill_date = mapped_column(Date)

    customer_name = mapped_column(Text)
    customer_gstin = mapped_column(Text, nullable=True)

    total_taxable = mapped_column(Numeric)
    cgst = mapped_column(Numeric)
    sgst = mapped_column(Numeric)
    igst = mapped_column(Numeric)
    invoice_total = mapped_column(Numeric)

    order_acceptance_id = mapped_column(String(50), nullable=True)

    import_batch = mapped_column(String(50))
    status = mapped_column(String(20), default="PENDING")

    created_at = mapped_column(DateTime, server_default=func.now())

    items = relationship(back_populates="item")

class StagingBillItem(Base):
    __tablename__ = "staging_bill_items"

    id = mapped_column(BigInteger, primary_key=True)

    bill_num = mapped_column(ForeignKey("staging_bill_headers.bill_num"))

    product_name = mapped_column(Text)

    hsn = mapped_column(String(20))

    quantity = mapped_column(Integer)

    rate = mapped_column(Numeric)

    taxable_amount = mapped_column(Numeric)

    cgst = mapped_column(Numeric)

    sgst = mapped_column(Numeric)

    igst = mapped_column(Numeric)

    total = mapped_column(Numeric)

    order_item_id = mapped_column(BigInteger, nullable=True)"""