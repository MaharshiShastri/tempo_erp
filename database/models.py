from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (Boolean, Date, DateTime, ForeignKey, Integer, BigInteger, Numeric, String, Text, 
                        JSON, func, Computed, Float, Index, CheckConstraint, text)

from sqlalchemy.dialects.postgresql import ARRAY

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, foreign

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    #Done
    email: Mapped[str] = mapped_column(String(255), primary_key=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[str] = mapped_column(String(100), nullable=False)

    dob: Mapped[date | None] = mapped_column(Date, nullable=True)

    phone_personal: Mapped[str | None] = mapped_column(String(20), nullable=True)

    phone_business: Mapped[str | None] = mapped_column(String(20), nullable=True)

    regions: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    department: Mapped[str] = mapped_column(String(50), server_default="General", nullable=True)

    quarterly_order_value_target: Mapped[int] = mapped_column(Integer, server_default="0", nullable=True)


    # Relationships
    activity_logs: Mapped[list["ActivityLog"]] = relationship(back_populates="operator", passive_deletes=True)

    dispatch_records: Mapped[list["DispatchRecord"]] = relationship(back_populates="operator", passive_deletes=True)

    grn_headers: Mapped[list["GRNHeader"]] = relationship(back_populates="operator", passive_deletes=True)

class ActivityLog(Base):
    #Done
    __tablename__ = "activity_logs"

    __table_args__ = (Index("idx_activity_entity", "entity_type", "entity_id"),)

    log_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, )

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False,)

    entity_id: Mapped[str] = mapped_column(String(100), nullable=False,)

    operator_email: Mapped[str | None] = mapped_column(ForeignKey("users.email", ondelete="SET NULL",), nullable=True,)

    log_type: Mapped[str] = mapped_column(String(50), server_default="COMMENT", nullable=True,)

    message: Mapped[str] = mapped_column(Text, nullable=False, )

    meta_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    operator: Mapped["User | None"] = relationship(back_populates="activity_logs",)

class OrderHeader(Base):
    __tablename__ = "order_headers"

    order_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # ---------------------------------------------------------
    # Tally identity
    # ---------------------------------------------------------

    tally_guid: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    # ---------------------------------------------------------
    # Tally order snapshot
    # ---------------------------------------------------------

    order_acceptance_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    order_acceptance_date: Mapped[date] = mapped_column(
        Date,
        nullable=True,
    )

    purchase_order_number: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )

    purchase_order_date: Mapped[date] = mapped_column(
        Date,
        nullable=True,
    )

    # IMPORTANT:
    # This is NOT the ClientCompany FK.
    # It is Tally's customer/party code.
    tally_customer_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    billing_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    billing_address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    payment_terms: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    dispatched_through: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    delivery_terms: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    due_date: Mapped[date] = mapped_column(
        Date,
        nullable=True,
    )

    ordered_by: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    packing_charges: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        server_default="0.00",
        nullable=True,
    )

    freight_charges: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        server_default="0.00",
        nullable=True,
    )

    tax_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        server_default="18.00",
        nullable=False,
    )

    buyer_gstin: Mapped[str | None] = mapped_column(
        String(15),
        nullable=True,
    )

    destination: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    state_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        server_default="0.00",
        nullable=False,
    )

    grand_total: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        server_default="0.00",
        nullable=False,
    )

    # ---------------------------------------------------------
    # Application-owned relationship to Sales customer
    # ---------------------------------------------------------

    customer_id: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("client_companies.id"),
        nullable=True,
        index=True,
    )

    # ---------------------------------------------------------
    # ERP workflow state
    # ---------------------------------------------------------

    current_stage_code: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("production_stages.code"),
        nullable=False,
        server_default="PENDING",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    customer: Mapped["ClientCompany"] = relationship(
        back_populates="orders",
    )

    current_stage: Mapped["ProductionStage"] = relationship(
        foreign_keys=[current_stage_code],
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )

    bills: Mapped[list["BillHeader"]] = relationship(
        back_populates="order",
    )

    production_stage_history: Mapped[
        list["ProductionStageHistory"]
    ] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="ProductionStageHistory.entered_at",
    )

    schedules: Mapped[list["ProductionSchedule"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )
    
class OrderItem(Base):
    __tablename__ = "order_items"

    __table_args__ = (
        CheckConstraint(
            "discount_percentage >= 0 AND discount_percentage <= 100",
            name="order_items_discount_percentage_check",
        ),
        CheckConstraint(
            "quantity > 0",
            name="order_items_quantity_check",
        ),
        CheckConstraint(
            "rate >= 0",
            name="order_items_rate_check",
        ),
    )

    order_item_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    order_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("order_headers.order_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    item_code: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("items_master.item_code"),
        nullable=False,
        index=True,
    )

    um: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )

    additional_spec_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    hsn_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    rate: Mapped[Decimal] = mapped_column(
        Numeric(15, 4),
        nullable=False,
    )

    discount_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        server_default="0.00",
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        Computed(
            "quantity * rate * "
            "(1 - discount_percentage / 100)",
            persisted=True,
        ),
        nullable=False,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    order: Mapped["OrderHeader"] = relationship(
        back_populates="items",
    )

    item: Mapped["ItemMaster"] = relationship(
        back_populates="order_items",
    )

    bill_items: Mapped[list["BillItem"]] = relationship(
        back_populates="order_item",
    )

class BillHeader(Base):
    __tablename__ = "bill_headers"

    bill_num: Mapped[str] = mapped_column(String(50), primary_key=True,)

    bill_date: Mapped[date] = mapped_column(Date, nullable=False,)

    order_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("order_headers.order_id"), nullable=True,index=True,)

    indian_state: Mapped[str | None] = mapped_column(String(100), nullable=True,)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False,)

    order: Mapped["OrderHeader | None"] = relationship(back_populates="bills",)

    items: Mapped[list["BillItem"]] = relationship(back_populates="bill", cascade="all, delete-orphan",)

class BillItem(Base):
    __tablename__ = "bill_items"

    bill_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True,)

    bill_num: Mapped[str] = mapped_column(String(50), ForeignKey("bill_headers.bill_num", ondelete="CASCADE"), nullable=False,)

    order_item_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("order_items.order_item_id"), nullable=True, index=True,)

    item_code: Mapped[str | None] = mapped_column(String(100), ForeignKey("items_master.item_code"), nullable=True,)

    quantity_shipped: Mapped[int] = mapped_column(Integer, nullable=False,)

    rate: Mapped[Decimal | None] = mapped_column(Numeric(15, 4), nullable=True,)

    amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True,)

    bill: Mapped["BillHeader"] = relationship(back_populates="items", )

    order_item: Mapped["OrderItem | None"] = relationship(back_populates="bill_items",)

    item: Mapped["ItemMaster | None"] = relationship()

class ItemMaster(Base):
    __tablename__ = "items_master"
    #Done
    item_code: Mapped[str] = mapped_column(String(100), primary_key=True,)

    item_name: Mapped[str] = mapped_column(String(255), nullable=False)

    item_group: Mapped[str | None] = mapped_column(String(100), nullable=True)

    rate: Mapped[Decimal] = mapped_column(Numeric(15, 2), server_default="0.00", nullable=False)

    unit_measure: Mapped[str] = mapped_column(String(20), server_default="NOS", nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime,server_default=func.now(), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=True)

    additional_spec_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    hsn_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    revision_no: Mapped[str] = mapped_column(String(50), server_default="", nullable=True)

    available_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", primaryjoin="foreign(OrderItem.item_code)==ItemMaster.item_code", back_populates="item")
    
class LogisticsPartner(Base):
    __tablename__ = "logistics_partners"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    cft_factor: Mapped[Decimal] = mapped_column(Numeric(10, 2), server_default="10", nullable=True)

    minimum_weight: Mapped[Decimal] = mapped_column(Numeric(10, 2), server_default="0", nullable=True)

    minimum_freight_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), server_default="0", nullable=True)

    documentation_charge: Mapped[Decimal] = mapped_column(Numeric(10, 2), server_default="0", nullable=True)

    fov_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="0", nullable=True)

    gst_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="18", nullable=True)

    partner_link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    local_loading_cost: Mapped[Decimal] = mapped_column(Numeric, server_default="0.0", nullable=True)

    hub_loading_max_cost: Mapped[Decimal] = mapped_column(Numeric, server_default="0.0", nullable=True)

    mobile_number: Mapped[str|None] = mapped_column(String(20))
    
    zones: Mapped[list["LogisticsZone"]] = relationship(back_populates="partner", cascade="all, delete-orphan",)

    zone_rates: Mapped[list["LogisticsZoneRate"]] = relationship(back_populates="partner", cascade="all, delete-orphan",)

    fuel_matrix: Mapped[list["LogisticsFuelMatrix"]] = relationship(back_populates="partner", cascade="all, delete-orphan",)

    oda_matrix: Mapped[list["LogisticsODAMatrix"]] = relationship(back_populates="partner", cascade="all, delete-orphan")

class LogisticsZone(Base):
    __tablename__ = "logistics_zones"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int] = mapped_column(Integer, ForeignKey("logistics_partners.id"), nullable=False)

    zone_code: Mapped[str] = mapped_column(String(10), nullable=False,)

    zone_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    states: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    sort_order: Mapped[int] = mapped_column(Integer, server_default="0", nullable=True)

    partner: Mapped["LogisticsPartner"] = relationship(back_populates="zones")

class LogisticsZoneRate(Base):
    __tablename__ = "logistics_zone_rates"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int] = mapped_column(Integer, ForeignKey("logistics_partners.id"), nullable=False,)

    destination_zone: Mapped[str | None] = mapped_column(String(10), nullable=True)

    rate_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    sort_order: Mapped[int] = mapped_column(Integer, server_default="0", nullable=True)

    partner: Mapped["LogisticsPartner"] = relationship(back_populates="zone_rates")

class LogisticsFuelMatrix(Base):
    __tablename__ = "logistics_fuel_matrix"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("logistics_partners.id"), nullable=True)

    fuel_price_from: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    fuel_price_to: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    surcharge_percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    sort_order: Mapped[int] = mapped_column(Integer, server_default="0", nullable=True)

    partner: Mapped["LogisticsPartner"] = relationship(back_populates="fuel_matrix")

class LogisticsODAMatrix(Base):
    __tablename__ = "logistics_oda_matrix"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("logistics_partners.id"), nullable=True)

    km_from: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    km_to: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    weight_from: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    weight_to: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    oda_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    sort_order: Mapped[int | None] = mapped_column(Integer, server_default="0", nullable=True)

    partner: Mapped["LogisticsPartner | None"] = relationship(back_populates="oda_matrix")

class DispatchRecord(Base):
    __tablename__ = "dispatch_records"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    destination_zone: Mapped[str | None] = mapped_column(String(10), nullable=True)

    chargeable_weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    basic_freight: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    fuel_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    fov_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    oda_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    hamali_detail: Mapped[str | None] = mapped_column(String(255), nullable=True)

    hamali_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    indian_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    dispatch_cost_gst: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    operator_email: Mapped[str | None] = mapped_column(String(255), ForeignKey("users.email", ondelete="SET NULL",), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    loading_charge: Mapped[Decimal] = mapped_column(Numeric, server_default="0.0", nullable=True)
    
    operator: Mapped["User | None"] = relationship(back_populates="dispatch_records")

class Task(Base):
    __tablename__ = "tasks"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    direction: Mapped[str | None] = mapped_column(String(50), nullable=True)

    is_incomplete: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=True)

    assigned_by: Mapped[str | None] = mapped_column(String(255), ForeignKey("users.email"), nullable=True)

    assigned_to: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    attachment_urls: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    creator: Mapped["User | None"] = relationship(foreign_keys=[assigned_by])

class CRMLead(Base):
    __tablename__ = "crm_leads"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)

    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)

    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    city_state: Mapped[str] = mapped_column(String(255), nullable=False)

    product_query: Mapped[str | None] = mapped_column(Text, nullable=True)

    gdpr_consent: Mapped[bool] = mapped_column(Boolean,server_default='false', nullable=True)

    assigned_region: Mapped[str | None] = mapped_column(String(100), nullable=True)

    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(String(50), server_default="New", nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

class ClientCompany(Base):
    __tablename__ = "client_companies"

    id: Mapped[str] = mapped_column(String(20), primary_key=True,)

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False,)

    address_line_1: Mapped[str] = mapped_column(String(255), nullable=False,)

    city: Mapped[str] = mapped_column(String(100), nullable=False,)

    state: Mapped[str] = mapped_column(String(100), nullable=False,)

    pincode: Mapped[str] = mapped_column(String(10), nullable=False,)

    contact_name: Mapped[str] = mapped_column(String(255), nullable=False,)

    contact_role: Mapped[str] = mapped_column(String(100), nullable=False,)

    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False, )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False,)

    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False,)

    orders: Mapped[list["OrderHeader"]] = relationship(back_populates="customer",)

class GRNHeader(Base):
    __tablename__ = "grn_headers"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    grn_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    receipt_date: Mapped[date] = mapped_column(Date, server_default=func.current_date(), nullable=True,)

    operator_email: Mapped[str | None] = mapped_column(String(255), ForeignKey("users.email"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    invoice_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True,)

    cgst: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True,)

    sgst: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True,)

    grand_total: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True,)

    items: Mapped[list["GRNItem"]] = relationship(back_populates="grn",cascade="all, delete-orphan")

    operator: Mapped["User | None"] = relationship(back_populates="grn_headers")

class GRNItem(Base):
    __tablename__ = "grn_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    grn_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("grn_headers.id", ondelete="CASCADE"), nullable=True)

    item_code: Mapped[str | None] = mapped_column(String(100), ForeignKey("test_items_master.item_code"), nullable=True)

    quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True,)

    rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), Computed("quantity * rate", persisted=True), nullable=True,)

    grn: Mapped["GRNHeader | None"] = relationship(back_populates="items",)

    item: Mapped["TestItemMaster"] = relationship(back_populates="grn_items")


class LeadTarget(Base):
    __tablename__ = "lead_targets"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)

    domain: Mapped[str] = mapped_column(String(255), nullable=False)

    requested_by: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[str] = mapped_column(String(50), server_default="Pending", nullable=True)
    
    active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    gtm_source: Mapped[str] = mapped_column(String(100), server_default="Snov.io", nullable=True)

    email_status: Mapped[str] = mapped_column(String(50), server_default="Not Sent", nullable=True)

    added_date: Mapped[date] = mapped_column(Date, server_default=func.current_date(), nullable=True)

    cost_per_credit: Mapped[Decimal] = mapped_column(Numeric(10, 4), server_default="0.015", nullable=True)

    emails_found: Mapped[int] = mapped_column(Integer, server_default="0", nullable=True)
    
    snovio_raw_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    rejected_reason: Mapped[str] = mapped_column(String(50), nullable=True)

    contacts: Mapped[list["LeadContact"]] = relationship(back_populates="target", cascade="all, delete-orphan")
    
class LeadContact(Base):
    __tablename__ = "lead_contacts"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    target_id: Mapped[int] = mapped_column(Integer, ForeignKey("lead_targets.id", ondelete="CASCADE"), nullable=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=True)

    designation: Mapped[str | None] = mapped_column(String(255), nullable=True)

    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_priority: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    target: Mapped["LeadTarget | None"] = relationship(back_populates="contacts")

class FAQQuery(Base):
    __tablename__ = "faq_queries"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    question: Mapped[str] = mapped_column(Text, nullable=False)

    answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    asked_by: Mapped[str] = mapped_column(String(255), nullable=False)

    answered_by: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(String(50), server_default="Pending", nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_email: Mapped[str] = mapped_column(String(255), nullable=False)

    user_name: Mapped[str] = mapped_column(String(255), nullable=False)

    action_route: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

class SystemErrorLog(Base):
    __tablename__ = "system_error_logs"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    route_path: Mapped[str | None] = mapped_column(String(255), nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    stack_trace: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

class SystemNotification(Base):
    __tablename__ = "system_notifications"
    #Done
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_email: Mapped[str] = mapped_column(String(255), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    message: Mapped[str] = mapped_column(Text, nullable=False)

    type: Mapped[str] = mapped_column(String(50), nullable=False)

    is_read: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)
    
class TestItemMaster(Base):
    __tablename__ = "test_items_master"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    item_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    item_specification: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime | None] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    grn_items: Mapped[list["GRNItem"]] = relationship(back_populates="item")

class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    item_code: Mapped[str | None] = mapped_column(String(100), ForeignKey("items_master.item_code"), nullable=True)

    quantity_change: Mapped[int] = mapped_column(Integer)

    stock_before: Mapped[int] = mapped_column(Integer)

    stock_after: Mapped[int] = mapped_column(Integer)

    movement_type: Mapped[str] = mapped_column(String(30))# ADJUSTMENT # DISPATCH # RETURN # PURCHASE

    remarks: Mapped[str | None] = mapped_column(Text)

    operator_email: Mapped[str] = mapped_column(ForeignKey("users.email"))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class QuotationChangeSnapshot(Base):
    __tablename__ = "quotation_change_snapshots"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    quotation_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "quotations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    # ---------------------------------------------------------
    # What was quoted
    # ---------------------------------------------------------

    quoted_product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    quoted_item_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    quoted_quantity: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 4),
        nullable=True,
    )

    quoted_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 4),
        nullable=True,
    )

    # ---------------------------------------------------------
    # What was actually ordered
    # ---------------------------------------------------------

    ordered_product_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    ordered_item_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    ordered_quantity: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 4),
        nullable=True,
    )

    ordered_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 4),
        nullable=True,
    )

    order_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("order_headers.order_id"),
        nullable=True,
    )

    quotation: Mapped["Quotation"] = relationship(
        back_populates="changes",
    )
    
class Quotation(Base):
    __tablename__ = "quotations"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    quote_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )

    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    client_company: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    client_address_line1: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    client_city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    client_postal_code: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    client_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    buyer_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    buyer_phone_number: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )

    enquiry_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    supply: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    installation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    freight: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_dealer: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    is_special_model: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    sales_user_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    sales_user_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    document_path: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        server_default="true",
        nullable=False,
    )

    # =========================================================
    # QUOTATION LIFECYCLE
    # =========================================================

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default="GENERATED",
        index=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
    )

    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
    )

    changed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
    )

    # Resulting ERP order, when quotation becomes an order.
    converted_order_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("order_headers.order_id"),
        nullable=True,
        index=True,
    )

    # =========================================================
    # Relationships
    # =========================================================

    converted_order: Mapped["OrderHeader | None"] = relationship(
        foreign_keys=[converted_order_id],
    )

    changes: Mapped[list["QuotationChangeSnapshot"]] = relationship(
        back_populates="quotation",
        cascade="all, delete-orphan",
    )
    
class ProductionStage(Base):
    __tablename__ = "production_stages"

    code: Mapped[str] = mapped_column(String(50), primary_key=True,)

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True,)

    sequence: Mapped[int] = mapped_column(Integer, nullable=False, unique=True,)

    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False,)

    expected_duration_hours: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True,)

    history: Mapped[list["ProductionStageHistory"]] = relationship(back_populates="stage",)

    schedules: Mapped[list["ProductionSchedule"]] = relationship(back_populates="stage",)

class ProductionStageHistory(Base):
    __tablename__ = "production_stage_history"

    __table_args__ = (Index("idx_production_stage_history_current", "order_id", postgresql_where=text("exited_at IS NULL"),),
                      Index("idx_production_stage_history_order", "order_id", "entered_at",),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True,)

    order_id: Mapped[str] = mapped_column(String(50), ForeignKey("order_headers.order_acceptance_id", ondelete="CASCADE",),nullable=False, )

    stage_code: Mapped[str] = mapped_column(String(50), ForeignKey("production_stages.code", ondelete="RESTRICT",), nullable=False,)

    entered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False,)

    exited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True,)

    changed_by: Mapped[str | None] = mapped_column(String(255), ForeignKey( "users.email", ondelete="SET NULL",),nullable=True,)

    order: Mapped["OrderHeader"] = relationship(back_populates="production_stage_history",)

    stage: Mapped["ProductionStage"] = relationship(back_populates="history", foreign_keys=[stage_code], )

    changed_by_user: Mapped["User | None"] = relationship(foreign_keys=[changed_by],)
    
class ProductionSchedule(Base):
    __tablename__ = "production_schedules"

    __table_args__ = (
        CheckConstraint("planned_end >= planned_start", name="production_schedule_planned_dates_check",),
        CheckConstraint("actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start", name="production_schedule_actual_dates_check",),
        Index("ix_production_schedule_stage_planned_start", "stage_code", "planned_start",),
        Index("ix_production_schedule_order", "order_id",),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True,)

    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("order_headers.order_id", ondelete="CASCADE"), nullable=False,)

    stage_code: Mapped[str] = mapped_column(String(50), ForeignKey("production_stages.code"), nullable=False,)

    planned_start: Mapped[datetime] = mapped_column(DateTime, nullable=False,)

    planned_end: Mapped[datetime] = mapped_column(DateTime, nullable=False,)

    actual_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True,)

    actual_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True,)

    priority: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False,)

    assigned_team: Mapped[str | None] = mapped_column(String(100), nullable=True,)

    status: Mapped[str] = mapped_column(String(30), server_default="PLANNED", nullable=False,)

    created_by: Mapped[str | None] = mapped_column(String(255), ForeignKey("users.email", ondelete="SET NULL"), nullable=True,)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False,)

    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    
    order: Mapped["OrderHeader"] = relationship(back_populates="schedules", )

    stage: Mapped["ProductionStage"] = relationship(back_populates="schedules", )