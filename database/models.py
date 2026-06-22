from __future__ import annotations

from sqlalchemy import (
    String, Integer, BigInteger, Text, Date, DateTime, Boolean,
    Numeric, ForeignKey, CheckConstraint, func, text
)
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# =========================
# Base
# =========================

class Base(DeclarativeBase):
    pass


# =========================
# USERS
# =========================

class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)

    dob: Mapped[str | None] = mapped_column(Date)
    phone_personal: Mapped[str | None] = mapped_column(String(20))
    phone_business: Mapped[str | None] = mapped_column(String(20))

    regions: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    department: Mapped[str] = mapped_column(String(50), server_default=text("'General'"))

    # relationships
    activity_logs = relationship("ActivityLog", back_populates="operator")
    tasks_assigned = relationship(
        "Task",
        primaryjoin="User.email==Task.assigned_by",
        viewonly=True
    )


# =========================
# ACTIVITY LOGS
# =========================

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)

    operator_email: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.email", ondelete="SET NULL")
    )

    log_type: Mapped[str | None] = mapped_column(String(50), server_default=text("'COMMENT'"))
    message: Mapped[str] = mapped_column(Text, nullable=False)

    metadata: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    operator = relationship("User", back_populates="activity_logs")


# =========================
# ORDER MODULE
# =========================

class OrderHeader(Base):
    __tablename__ = "order_headers"

    order_acceptance_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    order_acceptance_date: Mapped[str] = mapped_column(Date, nullable=False)
    purchase_order_number: Mapped[str] = mapped_column(String(100), nullable=False)
    purchase_order_date: Mapped[str] = mapped_column(Date, nullable=False)

    customer_code: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_terms: Mapped[str | None] = mapped_column(String(100))

    billing_name: Mapped[str] = mapped_column(String(255), nullable=False)
    billing_address: Mapped[str] = mapped_column(Text, nullable=False)

    dispatched_through: Mapped[str | None] = mapped_column(String(100))
    delivery_terms: Mapped[str | None] = mapped_column(String(100))

    due_date: Mapped[str] = mapped_column(Date, nullable=False)

    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete")
    bills = relationship("BillHeader", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    order_acceptance_id: Mapped[str | None] = mapped_column(
        String(50),
        ForeignKey("order_headers.order_acceptance_id", ondelete="CASCADE")
    )

    item_code: Mapped[str] = mapped_column(String(50), nullable=False)
    um: Mapped[str | None] = mapped_column(String(10))

    additional_spec_text: Mapped[str | None] = mapped_column(Text)
    hsn_code: Mapped[str] = mapped_column(String(8), nullable=False)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    rate: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    discount_percentage: Mapped[float] = mapped_column(
        Numeric(5, 2),
        server_default=text("0.00")
    )

    amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        server_default=text(
            "(quantity::numeric * rate * (1 - discount_percentage / 100.0))"
        )
    )

    order = relationship("OrderHeader", back_populates="items")


# =========================
# BILLING
# =========================

class BillHeader(Base):
    __tablename__ = "bill_headers"

    bill_num: Mapped[str] = mapped_column(String(50), primary_key=True)
    bill_date: Mapped[str] = mapped_column(Date, nullable=False)

    order_acceptance_id: Mapped[str | None] = mapped_column(
        String(50),
        ForeignKey("order_headers.order_acceptance_id")
    )

    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    order = relationship("OrderHeader", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete")


class BillItem(Base):
    __tablename__ = "bill_items"

    bill_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    bill_num: Mapped[str | None] = mapped_column(
        String(50),
        ForeignKey("bill_headers.bill_num", ondelete="CASCADE")
    )

    order_item_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("order_items.order_item_id")
    )

    quantity_shipped: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("quantity_shipped > 0"),
    )

    bill = relationship("BillHeader", back_populates="items")


# =========================
# CRM
# =========================

class CRMLead(Base):
    __tablename__ = "crm_leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(100))

    company_name: Mapped[str | None] = mapped_column(String(255))
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(50))

    city_state: Mapped[str] = mapped_column(String(255), nullable=False)
    product_query: Mapped[str | None] = mapped_column(Text)

    gdpr_consent: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))

    assigned_region: Mapped[str | None] = mapped_column(String(100))
    assigned_to: Mapped[str | None] = mapped_column(String(255))

    status: Mapped[str] = mapped_column(String(50), server_default=text("'New'"))
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())


# =========================
# TASKS
# =========================

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    direction: Mapped[str | None] = mapped_column(String(50))

    is_incomplete: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))

    assigned_by: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.email")
    )

    assigned_to: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())


# =========================
# INVENTORY
# =========================

class ItemMaster(Base):
    __tablename__ = "items_master"

    item_code: Mapped[str] = mapped_column(String(100), primary_key=True)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)

    item_group: Mapped[str | None] = mapped_column(String(100))

    rate: Mapped[float] = mapped_column(Numeric(15, 2), server_default=text("0.00"))

    unit_measure: Mapped[str] = mapped_column(String(20), server_default=text("'NOS'"))

    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))

    additional_spec_text: Mapped[str | None] = mapped_column(Text)
    hsn_code: Mapped[str | None] = mapped_column(String(20))

    revision_no: Mapped[str] = mapped_column(String(50), server_default=text("''"))


class TestItemMaster(Base):
    __tablename__ = "test_items_master"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    item_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    item_specification: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())


# =========================
# LOGISTICS
# =========================

class LogisticsPartner(Base):
    __tablename__ = "logistics_partners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    cft_factor: Mapped[float] = mapped_column(Numeric(10, 2), server_default=text("10"))
    minimum_weight: Mapped[float] = mapped_column(Numeric(10, 2), server_default=text("0"))
    minimum_freight_value: Mapped[float] = mapped_column(Numeric(10, 2), server_default=text("0"))
    documentation_charge: Mapped[float] = mapped_column(Numeric(10, 2), server_default=text("0"))

    fov_percentage: Mapped[float] = mapped_column(Numeric(5, 2), server_default=text("0"))
    gst_percentage: Mapped[float] = mapped_column(Numeric(5, 2), server_default=text("18"))

    partner_link: Mapped[str | None] = mapped_column(String(500))

    fuel_matrix = relationship("LogisticsFuelMatrix", back_populates="partner")
    oda_matrix = relationship("LogisticsODAMatrix", back_populates="partner")
    zones = relationship("LogisticsZone", back_populates="partner")
    zone_rates = relationship("LogisticsZoneRate", back_populates="partner")


class LogisticsFuelMatrix(Base):
    __tablename__ = "logistics_fuel_matrix"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int | None] = mapped_column(ForeignKey("logistics_partners.id"))

    fuel_price_from: Mapped[float | None] = mapped_column(Numeric(10, 2))
    fuel_price_to: Mapped[float | None] = mapped_column(Numeric(10, 2))
    surcharge_percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))

    sort_order: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    partner = relationship("LogisticsPartner", back_populates="fuel_matrix")


class LogisticsODAMatrix(Base):
    __tablename__ = "logistics_oda_matrix"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int | None] = mapped_column(ForeignKey("logistics_partners.id"))

    km_from: Mapped[float | None] = mapped_column(Numeric(10, 2))
    km_to: Mapped[float | None] = mapped_column(Numeric(10, 2))

    weight_from: Mapped[float | None] = mapped_column(Numeric(10, 2))
    weight_to: Mapped[float | None] = mapped_column(Numeric(10, 2))

    oda_charge: Mapped[float | None] = mapped_column(Numeric(10, 2))

    sort_order: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    partner = relationship("LogisticsPartner", back_populates="oda_matrix")


class LogisticsZone(Base):
    __tablename__ = "logistics_zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int] = mapped_column(ForeignKey("logistics_partners.id"), nullable=False)

    zone_code: Mapped[str] = mapped_column(String(10), nullable=False)
    zone_name: Mapped[str | None] = mapped_column(String(255))
    states: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    sort_order: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    partner = relationship("LogisticsPartner", back_populates="zones")


class LogisticsZoneRate(Base):
    __tablename__ = "logistics_zone_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    partner_id: Mapped[int] = mapped_column(ForeignKey("logistics_partners.id"), nullable=False)

    destination_zone: Mapped[str | None] = mapped_column(String(10))
    rate_per_kg: Mapped[float | None] = mapped_column(Numeric(10, 2))

    sort_order: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    partner = relationship("LogisticsPartner", back_populates="zone_rates")


# =========================
# GRN
# =========================

class GRNHeader(Base):
    __tablename__ = "grn_headers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    grn_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    vendor_name: Mapped[str | None] = mapped_column(String(255))

    receipt_date: Mapped[str] = mapped_column(Date, server_default=func.current_date())
    operator_email: Mapped[str | None] = mapped_column(String(255))

    invoice_number: Mapped[str | None] = mapped_column(String(100))

    subtotal: Mapped[float | None] = mapped_column(Numeric(12, 2))
    cgst: Mapped[float | None] = mapped_column(Numeric(12, 2))
    sgst: Mapped[float | None] = mapped_column(Numeric(12, 2))
    grand_total: Mapped[float | None] = mapped_column(Numeric(12, 2))

    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    items = relationship("GRNItem", back_populates="grn", cascade="all, delete")


class GRNItem(Base):
    __tablename__ = "grn_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    grn_id: Mapped[int | None] = mapped_column(ForeignKey("grn_headers.id", ondelete="CASCADE"))

    item_code: Mapped[str | None] = mapped_column(String(100))

    quantity: Mapped[float | None] = mapped_column(Numeric(10, 2))
    rate: Mapped[float | None] = mapped_column(Numeric(10, 2))

    amount: Mapped[float | None] = mapped_column(
        Numeric(10, 2),
        server_default=text("(quantity * rate)")
    )

    grn = relationship("GRNHeader", back_populates="items")