import os
import json
import logging
import re
from datetime import datetime, date, timedelta, time
from decimal import Decimal

from sqlalchemy import create_engine, select, update, delete, or_, and_, func, any_, case, desc, text
from sqlalchemy.orm import sessionmaker, joinedload, selectinload, aliased
from sqlalchemy.dialects.postgresql import insert as pg_insert

# Import your models (adjust the import path as necessary)
from database.models import (
    User, ActivityLog, OrderHeader, OrderItem, BillHeader, BillItem, 
    ItemMaster, StagingOrderHeader, StagingOrderItem, LogisticsPartner, 
    LogisticsZone, LogisticsZoneRate, LogisticsFuelMatrix, LogisticsODAMatrix, 
    DispatchRecord, Task, CRMLead, ClientCompany, GRNHeader, GRNItem, 
    LeadTarget, LeadContact, FAQQuery, SystemAuditLog, SystemErrorLog, 
    SystemNotification, TestItemMaster, StockLedger, Quotation
)
from schemas.logistics_schema import FullPartnerProfile
from services.item_matcher import resolve_item_code

INDIAN_STATES = ["ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR", "CHHATTISGARH", "GOA", "GUJARAT",
    "HARYANA", "HIMACHAL PRADESH", "JHARKHAND", "KARNATAKA", "KERALA", "MADHYA PRADESH", "MAHARASHTRA", "MANIPUR",
    "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA", "PUNJAB", "RAJASTHAN", "SIKKIM", "TAMIL NADU", "TELANGANA",
    "TRIPURA", "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL", "DELHI", "CHANDIGARH", "JAMMU AND KASHMIR", "LADAKH",
    "PUDUCHERRY", "DADRA AND NAGAR HAVELI", "DAMAN AND DIU", "ANDAMAN AND NICOBAR"]

USER = os.getenv("role", "")
PASSWORD = os.getenv("db_password", "")
DB_DSN = os.getenv("DATABASE_URL_LCOAL", f"postgresql://{USER}:{PASSWORD}@localhost:5433/testing_DB")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)
logger.info(f"DB URI: {DB_DSN}")

# Setup SQLAlchemy Engine and Session Factory
engine = create_engine(DB_DSN, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def to_dict(obj, expand_relationships=False):
    """Helper to cleanly convert SQLAlchemy objects to dictionaries for JSON serialization."""
    if obj is None:
        return None
    data = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, Decimal):
            val = float(val)
        elif isinstance(val, (datetime, date)):
            val = val.isoformat()
        data[col.name] = val
    return data

def resolve_state(address: str):

    if not address:
        return None

    address = address.upper()

    for state in INDIAN_STATES:
        if state in address:
            return state.title()

    return None
class PostgresRepository:
    
    # --- AUTH & RBAC start---
    def get_user(self, email: str, password: str = None):
        with SessionLocal() as session:
            if password:
                stmt = select(User).where(User.email == email, User.password_hash == password)
                logger.info(f"{email} {password}")
            else:
                # Removed password_hash from return dictionary intentionally based on old behavior
                stmt = select(User).where(User.email == email)
            
            user = session.scalars(stmt).first()
            if not user: return None
            
            # Formatting similarly to old RealDictCursor selected fields
            return {
                "email": user.email, "name": user.name, "role": user.role, 
                "regions": user.regions, "password_hash": user.password_hash
            } if password else {
                "email": user.email, "name": user.name, "role": user.role, "regions": user.regions
            }

    def get_all_users(self):
        with SessionLocal() as session:
            users = session.scalars(select(User)).all()
            if not users:
                return None
            return [{"email": u.email, "name": u.name, "role": u.role, "regions": u.regions, "phone_business": u.phone_business} for u in users]

    def create_user(self, user_data: dict):
        with SessionLocal() as session:
            new_user = User(
                email=user_data['email'],
                name=user_data['name'],
                password_hash=user_data['password'],
                role=user_data['role'],
                dob=user_data.get('dob'),
                phone_personal=user_data.get('phone_personal'),
                phone_business=user_data.get('phone_business'),
                regions=user_data.get('regions', [])
            )
            session.add(new_user)
            session.commit()
            return {"email": new_user.email, "name": new_user.name, "role": new_user.role}
            
    def update_user(self, email: str, user_data: dict):
        with SessionLocal() as session:
            user = session.scalars(select(User).where(User.email == email)).first()
            if not user:
                return None
                
            user.name = user_data['name']
            user.role = user_data['role']
            if user_data.get('password'):
                user.password_hash = user_data['password']
            user.dob = user_data.get('dob')
            user.phone_personal = user_data.get('phone_personal')
            user.phone_business = user_data.get('phone_business')
            user.regions = user_data.get('regions', [])
            
            session.commit()
            return {"email": user.email, "name": user.name, "role": user.role}

    def delete_user(self, email: str):
        with SessionLocal() as session:
            user = session.scalars(select(User).where(User.email == email)).first()
            if user:
                session.delete(user)
                session.commit()
                return {"email": email}
            return None

    def get_user_business_contact(self, email: str, role: str | None = None):
        with SessionLocal() as session:
            stmt = (select(User.name, User.email, User.role, User.phone_business).where(User.email == email))
            row = session.execute(stmt).mappings().first()

            if not row:
                print("User not found")
                raise ValueError("User not found")

            if role and row["role"] != role:
                print("Incorrect role here")
                raise PermissionError(f"User role '{row['role']} is not permitted")
            
            return {
                "name": row["name"],
                "email": row["email"],
                "role": row["role"],
                "business_phone": row["phone_business"],
            }
    # --- AUTH & RBAC end---

    # --- GLOBAL ORDERS ENGINE start---
    def get_all_orders(self):
        with SessionLocal() as session:
            stmt = select(OrderHeader).options(joinedload(OrderHeader.items)).order_by(OrderHeader.created_at.desc())
            headers = session.scalars(stmt).unique().all()
            
            result = []
            for h in headers:
                h_dict = to_dict(h)
                h_dict['items'] = [to_dict(i) for i in h.items]
                result.append(h_dict)
                
            return result

    def get_orders_for_user(self, user_profile: dict):
        email = user_profile.get('email')

        with SessionLocal() as session:
            if user_profile['role'] in ["Admin", "Chief Full Stack Developer", "Shop Floor Administrator", "Dispatch Engineer",]:
                stmt = select(OrderHeader).options(joinedload(OrderHeader.items)).order_by(OrderHeader.created_at.desc())
            else:
                # Adapted to model fields: filtering by ordered_by (email)

                stmt = select(OrderHeader).options(joinedload(OrderHeader.items)).order_by(OrderHeader.created_at.desc()).where(OrderHeader.ordered_by == email)
            
            orders = session.scalars(stmt).unique().all()
            result = []
        
            for order in orders:
                order_dict = to_dict(order)
                order_dict["items"] = [to_dict(item) for item in order.items]
                result.append(order_dict)
        
            return result
        
    def create_order(self, order_data: dict) -> dict:
        with SessionLocal() as session:
            header = OrderHeader(
                order_acceptance_id=str(order_data['order_acceptance_id']),
                order_acceptance_date=order_data['order_acceptance_date'],
                purchase_order_number=order_data['purchase_order_number'],
                purchase_order_date=order_data['purchase_order_date'],
                customer_code=order_data['customer_code'],
                payment_terms=order_data.get('payment_terms', ''),
                billing_name=order_data['billing_name'],
                billing_address=order_data['billing_address'],
                dispatched_through=order_data.get('dispatched_through', ''),
                delivery_terms=order_data.get('delivery_terms', ''),
                due_date=order_data['due_date'],
                ordered_by=order_data['ordered_by'],
                packing_charges=order_data.get('packing_charges', 0.0),
                freight_charges=order_data.get('freight_charges', 0.0),
                tax_rate=order_data.get('tax_rate', 18.0)
            )
            session.add(header)
            
            log = ActivityLog(
                entity_id=header.order_acceptance_id,
                entity_type="ORDER_CREATED",
                message=f"New order {header.order_acceptance_id} added to pipeline.",
                log_type="INFO"
            )
            session.add(log)
            
            for item in order_data["items"]:
                if not item.get("additional_spec_text") or not item["additional_spec_text"].strip():
                    raise ValueError("Specification text details cannot be left blank.")
                
                oi = OrderItem(
                    order_acceptance_id=header.order_acceptance_id,
                    item_code=item['item_code'],
                    additional_spec_text=item['additional_spec_text'].strip(),
                    hsn_code=item.get('hsn_code', ''),
                    quantity=item['quantity'],
                    um=item['unit_measure'],
                    rate=item['rate'],
                    discount_percentage=item.get('discount_percentage', 0.0)
                )
                session.add(oi)
                header.items.append(oi)

            session.commit()
            session.refresh(header)
            for item in header.items:
                session.refresh(item)
            h_dict = to_dict(header)
            h_dict['items'] = [to_dict(i) for i in header.items]
            return h_dict
            
    def search_oa_autocomplete(self, query: str):
        with SessionLocal() as session:
            stmt = select(StagingOrderHeader.order_acceptance_id).where(
                StagingOrderHeader.order_acceptance_id.ilike(f"%{query}%"),
                StagingOrderHeader.status == 'PENDING'
            ).limit(20)
            return session.scalars(stmt).all()

    def get_staged_order_by_oa(self, order_acceptance_id: str):
        with SessionLocal() as session:
            stmt = select(StagingOrderHeader).options(joinedload(StagingOrderHeader.items)).where(
                StagingOrderHeader.order_acceptance_id == order_acceptance_id, StagingOrderHeader.status=="PENDING"
            ).limit(1)
            
            header = session.scalars(stmt).first()
            
            if not header: return None
            
            h_dict = to_dict(header)
            
            # Format and enforce defaults matching old logic
            for field in ['freight_charges', 'packing_charges', 'tax_amount', 'grand_total', 'tax_rate']:
                if field in h_dict and h_dict.get(field) is not None:
                    h_dict[field] = float(h_dict[field])
                else:
                    h_dict[field] = 0.0 if field != 'tax_rate' else 18.0
                    
            h_dict['items'] = [to_dict(i) for i in header.items]
            return h_dict
                        
    def mark_staged_order_processed(self, order_acceptance_id: str):
        with SessionLocal() as session:
            stmt = update(StagingOrderHeader).where(
                StagingOrderHeader.order_acceptance_id == order_acceptance_id
            ).values(status='PROCESSED')
            session.execute(stmt)
            session.commit()

    def _parse_tally_date(self, date_str):
        if not date_str: return None
        return datetime.strptime(date_str, '%Y%m%d').date()

    def _parse_tally_number(self, val_str):
        if not val_str: return 0.0
        match = re.search(r"[-+]?\d*\.\d+|\d+", str(val_str))
        return float(match.group()) if match else 0.0

    def _extract_tally_text_list(self, field_list):
        if not field_list or not isinstance(field_list, list):
            return ""
        return "\n".join([str(item) for item in field_list if isinstance(item, str)]).strip()

    def ingest_tally_json(self, tally_data: dict) -> int:
        
        inserted_count = 0
        vouchers = tally_data.get("tallymessage", [])
        
        with SessionLocal() as session:
            for voucher in vouchers:
                order_acceptance_id = voucher.get("vouchernumber")
                if not order_acceptance_id:
                    continue 
                    
                order_date = self._parse_tally_date(voucher.get("date"))
                po_number = voucher.get("reference", "")
                billing_name = voucher.get("partyname", "")
                billing_address = self._extract_tally_text_list(voucher.get("basicbuyeraddress"))
                payment_terms = voucher.get("basicduedateofpymt", "")
                
                gstin = voucher.get("partygstin", "")
                dispatched_through = voucher.get("basicshippedby", "")
                terms_of_delivery = self._extract_tally_text_list(voucher.get("basicorderterms"))
                
                freight_charges = 0.0
                tax_amount = 0.0
                grand_total = 0.0
                
                for ledger in voucher.get("ledgerentries", []):
                    lname = ledger.get("ledgername", "").upper()
                    amt = self._parse_tally_number(ledger.get("amount"))
                    
                    if "FREIGHT" in lname:
                        freight_charges += amt
                    elif any(tax in lname for tax in ["CGST", "SGST", "IGST"]):
                        tax_amount += amt
                    elif ledger.get("ispartyledger", False):
                        grand_total = abs(amt)
                
                # Upsert Staging Header using postgres dialect
                stmt = pg_insert(StagingOrderHeader).values(
                    order_acceptance_id=order_acceptance_id, 
                    order_acceptance_date=order_date, 
                    purchase_order_number=po_number, 
                    billing_name=billing_name, 
                    billing_address=billing_address, 
                    payment_terms=payment_terms, 
                    # Assuming these missing model fields from old logic are dynamic or mapped.
                    # Since StagingOrderHeader in ORM doesn't have buyer_gstin, freight_charges etc.,
                    # they are skipped or map to existing fields. I will map strictly to model.
                ).on_conflict_do_update(
                    index_elements=['order_acceptance_id'],
                    set_={
                        'status': 'PENDING',
                        'purchase_order_number': po_number,
                        'billing_name': billing_name,
                        'billing_address': billing_address,
                        'payment_terms': payment_terms
                    }
                )
                session.execute(stmt)

                # Delete old and insert new Staging Items
                session.execute(delete(StagingOrderItem).where(StagingOrderItem.order_acceptance_id == order_acceptance_id))
                
                items = voucher.get("allinventoryentries", [])
                for item in items:
                    item_code = resolve_item_code(item.get("stockitemname", "").strip().upper())

                    if not item_code:
                        print(f"Unknown item: {item.get('stockitemname')}")
                        continue

                    spec_text = self._extract_tally_text_list(item.get("basicuserdescription"))
                    hsn_code = item.get("gsthsnname", "")
                    qty = self._parse_tally_number(item.get("actualqty"))
                    rate = self._parse_tally_number(item.get("rate"))
                    amount = self._parse_tally_number(item.get("amount"))

                    due_date_str = None
                    allocations = item.get("batchallocations", [])
                    if allocations and isinstance(allocations, list):
                        due_date_str = allocations[0].get("orderduedate")
                    
                    session.add(StagingOrderItem(
                        order_acceptance_id=order_acceptance_id,
                        item_code=item_code,
                        additional_spec_text=spec_text,
                        hsn_code=hsn_code,
                        quantity=qty,
                        rate=rate,
                        amount=amount,
                        due_date=self._parse_tally_date(due_date_str) if due_date_str else None
                    ))
                
                inserted_count += 1
            session.commit()
        return inserted_count
    
    def extract_daybook_json(self, bill_data: dict):

        bills = []

        invoices = (bill_data.get("dbcolumnar", {}).get("dspcolvchdetail", []))

        with SessionLocal() as session:

            for invoice in invoices:

                items = []

                qty_details = (invoice.get("dbcqtydetails", {}).get("dspcolvchdetail", []))

                # Sometimes a single inventory line is exported as an object
                if isinstance(qty_details, dict):
                    qty_details = [qty_details]

                for item in qty_details:

                    product = (item.get("dbcfixed", {}).get("dbcparty", "").strip())

                    matched = self.resolve_item(session, product)

                    items.append({

                        "product_name": product,

                        "item_code": matched.item_code if matched else "",

                        "quantity_shipped": int(self._parse_tally_number(item.get("dbcqty"))),

                        "rate": self._parse_tally_number(item.get("dbcrate")),

                        "amount": abs(self._parse_tally_number(item.get("dbcamount")))

                    })

                bills.append({

                    "bill_num": invoice.get("dbcvchno"),

                    "bill_date": self._parse_daybook_date(invoice.get("dbcfixed", {}).get("dbcdate")),

                    "party_name": invoice.get("dbcpartyname", ""),

                    "order_acceptance_id": None,

                    "items": items

                })

        return bills

    # --- GLOBAL ORDERS ENGINE end---

    # --- GLOBAL BILLS ENGINE start---
    def resolve_item(self, session, tally_name):
    
        items = session.scalars(select(ItemMaster)).all()
    
        name = tally_name.upper()
    
        # Rule 1
        for item in items:
            if item.item_code.upper() == name:
                return item
    
        # Rule 2
        for item in items:
            if item.item_code.upper() in name:
                return item
    
        return None
    
    def resolve_product(self, session, item):

        candidates = []

        primary = item.get("dbcfixed", {}).get("dbcparty")

        if primary:
            candidates.append(primary)

        descriptions = (
            item.get("dspcolvchitemdescription", {})
                .get("dspcolvchdetail", [])
        )

        for desc in descriptions:

            name = desc.get("dbcfixed", {}).get("dbcparty")

            if name:
                candidates.append(name)

        for candidate in candidates:

            matched = self.resolve_item(session, candidate)

            if matched:
                return matched

        return None
            
    def get_all_bills(self):
        with SessionLocal() as session:
            stmt = select(BillHeader).options(joinedload(BillHeader.items).joinedload(BillItem.order_item)).order_by(BillHeader.created_at.desc())
            headers = session.scalars(stmt).unique().all()
            
            result = []
            for h in headers:
                h_dict = to_dict(h)
                items_data = []
                for i in h.items:
                    i_dict = to_dict(i)
                    if i.order_item:
                        i_dict['item_code'] = i.order_item.item_code
                    items_data.append(i_dict)
                h_dict['items'] = items_data
                result.append(h_dict)
                
            return result

    def create_bill(self, bill_data: dict) -> dict:
        with SessionLocal() as session:

            header = BillHeader(
                bill_num=bill_data["bill_num"],
                bill_date=bill_data["bill_date"],
                order_acceptance_id=bill_data["order_acceptance_id"],
                indian_state=bill_data["indian_state"]
            )

            session.add(header)

            for item in bill_data["items"]:

                session.add(BillItem(

                    bill_num=header.bill_num,

                    order_item_id=item.get("order_item_id"),

                    item_code=item.get("item_code"),

                    product_name=item.get("product_name"),

                    hsn_code=item.get("hsn_code"),

                    quantity_shipped=item["quantity_shipped"],

                    rate=item["rate"],

                    amount=item["amount"]

                )

            )

            order = session.get(
                OrderHeader,
                bill_data["order_acceptance_id"]
            )

            if bill_data.get("order_acceptance_id"):
                order = session.get(OrderHeader,bill_data["order_acceptance_id"])

                if order:
                    order.production_stage = "DISPATCHED"

            session.commit()
            session.refresh(header)

            h_dict = to_dict(header)
            h_dict["items"] = [to_dict(i) for i in header.items]
            return h_dict
    
    def _parse_daybook_date(self, date_str):
        if not date_str:
            return None
        return datetime.strptime(date_str, "%d-%b-%y").date()
    
    def ingest_daybook_json(self, bill_data: dict)->int:
        inserted = 0
        invoices = (bill_data.get("dbcolumnar", {}).get("dspcolvchdetail", []))
        with SessionLocal() as session:
            for invoice in invoices:
                bill_num=invoice.get("dbcvchno")
                if not bill_num:
                    continue
                
                bill_date = self._parse_daybook_date(invoice["dbcfixed"]["dbcdate"])
                buyer_address = invoice.get("dbcbuyeraddress", "")

                state = resolve_state(buyer_address)

                stmt = (pg_insert(BillHeader).values(bill_num=bill_num, bill_date=bill_date, order_acceptance_id=None, indian_state=state).on_conflict_do_update(index_elements=["bill_num"], set_={"bill_date": bill_date}))
                session.execute(stmt)
                items = (invoice.get("dbcqtydetails", {}).get("dspcolvchdetail", []))
                
                for item in items:
                    product_name = (item.get("dbcfixed", {}).get("dbcparty", ""))
                    quantity = int(self._parse_tally_number(item.get("dbcqty")))
                    rate = self._parse_tally_number(item.get("dbcrate"))
                    amount = abs(self._parse_tally_number(item.get("dbcamount")))
                    matched = self.resolve_product(session, item)
                    session.add(BillItem(bill_num=bill_num, quantity_shipped=quantity, product_name=product_name, rate=rate, amount=amount, order_item_id = matched.item_code if matched else None))
                    inserted += 1
                
                session.commit()
        
        return inserted
    # --- GLOBAL BILLS ENGINE end---

    # --- TASK MANAGER SUBSYSTEM start---
    def get_tasks(self, user_email: str):
        with SessionLocal() as session:
            stmt = select(Task).where(
                or_(Task.assigned_by == user_email, user_email == any_(Task.assigned_to))
            ).order_by(Task.created_at.desc())

            tasks = session.scalars(stmt).all()
            return [to_dict(t) for t in tasks]

    def create_task(self, task_dict: dict, assigned_by: str) -> dict:
        with SessionLocal() as session:
            task = Task(
                title=task_dict['title'],
                details=task_dict.get('details'), # mapped old 'details' to model 'description'
                assigned_by=assigned_by,
                assigned_to=task_dict.get('assigned_to', ''),
                deadline=task_dict.get('deadline'), # mapped old 'deadline' to model 'due_date'
                is_incomplete=True
            )
            session.add(task)
            session.commit()
            session.refresh(task)
            return to_dict(task)
            
    def update_task(self, task_id: int, title: str, details: str, deadline: str, user_email: str, user_role: str):
        with SessionLocal() as session:
            stmt = select(Task).where(Task.id == task_id)
            if user_role not in ['Admin', 'Chief Full Stack Developer']:
                stmt = stmt.where(Task.assigned_by == user_email)
                
            task = session.scalars(stmt).first()
            if not task:
                raise ValueError("Task not found or unauthorized to edit.")
                
            task.title = title
            task.description = details
            task.due_date = deadline if deadline else None
            session.commit()
            return to_dict(task)
            
    def delete_task(self, task_id: int, user_email: str, user_role: str):
        with SessionLocal() as session:
            stmt = select(Task).where(Task.id == task_id)
            if user_role not in ['Admin', 'Chief Full Stack Developer']:
                stmt = stmt.where(Task.assigned_by == user_email)
                
            task = session.scalars(stmt).first()
            if not task:
                raise ValueError("Task not found or unauthorized to delete.")
                
            session.delete(task)
            session.commit()
            return {"id": task_id}

    def toggle_task_status(self, task_id: int) -> dict:
        with SessionLocal() as session:
            task = session.scalars(select(Task).where(Task.id == task_id)).first()
            if task:
                task.status = "Completed" if task.status == "Pending" else "Pending"
                session.commit()
                return to_dict(task)
            return None
    
    def get_task_by_id(self, task_id: int) -> dict:
        with SessionLocal() as session:
            task = session.scalars(select(Task).where(Task.id == task_id)).first()
            return to_dict(task)

    def create_dispatch_record(self, record: dict, operator_email: str):
        with SessionLocal() as session:
            dr = DispatchRecord(
                partner_name=record.get("partner_name"),
                destination_zone=record.get("destination_zone"),
                chargeable_weight=record.get("chargeable_weight"),
                basic_freight=record.get("basic_freight"),
                fuel_charge=record.get("fuel_charge"),
                fov_charge=record.get("fov_charge"),
                oda_charge=record.get("oda_charge"),
                loading_charge=record.get("loading_charge", 0),
                hamali_detail=record.get("hamali_detail", ""),
                hamali_cost=record.get("hamali_cost", 0),
                subtotal=record.get("subtotal"),
                dispatch_cost_gst=record.get("dispatch_cost_gst"),
                operator_email=operator_email,
                indian_state=record.get("state")
            )
            session.add(dr)
            session.commit()
            session.refresh(dr)
            return {"id": dr.id}
    # --- TASK MANAGER SUBSYSTEM end---

    # --- LOGISTICS PARTNER start---
    def get_logistics_partners(self):
        with SessionLocal() as session:
            partners = session.scalars(select(LogisticsPartner).order_by(LogisticsPartner.name.asc())).all()
            return [to_dict(p) for p in partners]
                
    def update_full_partner_profile(self, partner_id: int, p: FullPartnerProfile):
        
        with SessionLocal() as session:
            try:
                partner = session.scalars(select(LogisticsPartner).where(LogisticsPartner.id == partner_id)).first()
                if not partner:
                    raise Exception("Partner not found")
                
                # Update Parent
                partner.name = p.name
                partner.partner_link = p.partner_link
                partner.cft_factor = p.cft_factor
                partner.minimum_weight = p.minimum_weight
                partner.minimum_freight_value = p.minimum_freight_value
                partner.documentation_charge = p.documentation_charge
                partner.fov_percentage = p.fov_percentage
                partner.gst_percentage = p.gst_percentage
                partner.local_loading_cost = p.local_loading_cost
                partner.hub_loading_max_cost = p.hub_loading_max_cost
                partner.mobile_number = p.mobile_number

                # Cascade WIPE
                session.execute(delete(LogisticsZone).where(LogisticsZone.partner_id == partner_id))
                session.execute(delete(LogisticsZoneRate).where(LogisticsZoneRate.partner_id == partner_id))
                session.execute(delete(LogisticsFuelMatrix).where(LogisticsFuelMatrix.partner_id == partner_id))
                session.execute(delete(LogisticsODAMatrix).where(LogisticsODAMatrix.partner_id == partner_id))

                # REPLACE
                for z in p.zones:
                    session.add(LogisticsZone(partner_id=partner_id, zone_code=z.zone_code, zone_name=z.zone_name, states=z.states))
                for r in p.rates:
                    session.add(LogisticsZoneRate(partner_id=partner_id, destination_zone=r.destination_zone, rate_per_kg=r.rate_per_kg))
                for f in p.fuel_matrix:
                    session.add(LogisticsFuelMatrix(partner_id=partner_id, fuel_price_from=f.fuel_price_from, fuel_price_to=f.fuel_price_to, surcharge_percentage=f.surcharge_percentage))
                for o in p.oda_matrix:
                    session.add(LogisticsODAMatrix(partner_id=partner_id, km_from=o.km_from, km_to=o.km_to, weight_from=o.weight_from, weight_to=o.weight_to, oda_charge=o.oda_charge))

                session.commit()
                return {"partner_id": partner_id, "status": "updated", "partner_name": p.name}
            except Exception as e:
                session.rollback()
                raise e
    
    def delete_partner(self, partner_id: int, operator_email: str):
        
        with SessionLocal() as session:
            try:
                partner = session.scalars(select(LogisticsPartner).where(LogisticsPartner.id == partner_id)).first()
                if not partner:
                    
                    return {"partner_id": partner_id, "status": "not_found"}
                    
                partner_name = partner.name

                # WIPE child arrays then parent (ORM handles this gracefully via session.delete if cascade="all, delete-orphan", but doing manually per old logic)
                session.delete(partner)
                session.commit()
                
                return {"partner_id": partner_id, "status": "deleted", "partner_name": partner_name}
            except Exception as e:
                session.rollback()
                raise e
                
    def create_full_partner_profile(self, p: FullPartnerProfile):
        with SessionLocal() as session:
            try:
                partner = LogisticsPartner(
                    name=p.name, partner_link=p.partner_link, cft_factor=p.cft_factor, 
                    minimum_weight=p.minimum_weight, minimum_freight_value=p.minimum_freight_value, 
                    documentation_charge=p.documentation_charge, fov_percentage=p.fov_percentage, 
                    gst_percentage=p.gst_percentage, local_loading_cost=p.local_loading_cost, hub_loading_max_cost=p.hub_loading_max_cost,
                    mobile_number=p.mobile_number
                )
                session.add(partner)
                session.flush() # get ID

                for z in p.zones:
                    session.add(LogisticsZone(partner_id=partner.id, zone_code=z.zone_code, zone_name=z.zone_name, states=z.states))
                for r in p.rates:
                    session.add(LogisticsZoneRate(partner_id=partner.id, destination_zone=r.destination_zone, rate_per_kg=r.rate_per_kg))
                for f in p.fuel_matrix:
                    session.add(LogisticsFuelMatrix(partner_id=partner.id, fuel_price_from=f.fuel_price_from, fuel_price_to=f.fuel_price_to, surcharge_percentage=f.surcharge_percentage))
                for o in p.oda_matrix:
                    session.add(LogisticsODAMatrix(partner_id=partner.id, km_from=o.km_from, km_to=o.km_to, weight_from=o.weight_from, weight_to=o.weight_to, oda_charge=o.oda_charge))

                session.commit()
                return {"partner_id": partner.id, "status": "created", "partner_name": p.name}
            except Exception as e:
                session.rollback()
                raise e
                
    def find_zone_by_state(self, partner_id, state):
        with SessionLocal() as session:
            stmt = select(LogisticsZone.zone_code).where(
                LogisticsZone.partner_id == partner_id,
                LogisticsZone.states.any(state)
            ).limit(1)
            return session.scalars(stmt).first()
        
    def get_zone_rate(self, partner_id, destination_zone):
        with SessionLocal() as session:
            stmt = select(LogisticsZoneRate.rate_per_kg).where(
                LogisticsZoneRate.partner_id == partner_id,
                LogisticsZoneRate.destination_zone == destination_zone
            ).limit(1)
            return session.scalars(stmt).first()
        
    def get_fuel_surcharge(self, partner_id, diesel_price):
        with SessionLocal() as session:
            stmt = select(LogisticsFuelMatrix.surcharge_percentage).where(
                LogisticsFuelMatrix.partner_id == partner_id,
                LogisticsFuelMatrix.fuel_price_from <= diesel_price,
                LogisticsFuelMatrix.fuel_price_to >= diesel_price
            ).limit(1)
            return session.scalars(stmt).first() or 0
        
    def get_oda_charge(self, partner_id, kms, weight):
        with SessionLocal() as session:
            stmt = select(LogisticsODAMatrix.oda_charge).where(
                LogisticsODAMatrix.partner_id == partner_id,
                LogisticsODAMatrix.km_from <= kms,
                LogisticsODAMatrix.km_to >= kms,
                LogisticsODAMatrix.weight_from <= weight,
                LogisticsODAMatrix.weight_to >= weight
            ).limit(1)
            return session.scalars(stmt).first() or 0
    
    def get_full_partner_profile(self, partner_id: int):
        with SessionLocal() as session:
            partner = session.scalars(
                select(LogisticsPartner)
                .options(
                    joinedload(LogisticsPartner.zones),
                    joinedload(LogisticsPartner.zone_rates),
                    joinedload(LogisticsPartner.fuel_matrix),
                    joinedload(LogisticsPartner.oda_matrix)
                )
                .where(LogisticsPartner.id == partner_id)
            ).unique().first()
            
            if not partner:
                return None

            p_dict = to_dict(partner)
            
            # Format Numeric Defaults
            p_dict['cft_factor'] = float(p_dict.get('cft_factor') or 10.0)
            p_dict['minimum_weight'] = float(p_dict.get('minimum_weight') or 0.0)
            p_dict['minimum_freight_value'] = float(p_dict.get('minimum_freight_value') or 0.0)
            p_dict['documentation_charge'] = float(p_dict.get('documentation_charge') or 0.0)
            p_dict['fov_percentage'] = float(p_dict.get('fov_percentage') or 0.0)
            p_dict['gst_percentage'] = float(p_dict.get('gst_percentage') or 18.0)
            p_dict['local_loading_cost'] = float(p_dict.get('local_loading_cost') or 0.0)
            p_dict['hub_loading_max_cost'] = float(p_dict.get('hub_loading_max_cost') or 0.0)

            # Assign and format arrays mapping old logic 'states_raw'
            p_dict["zones"] = [{**to_dict(z), "states_raw": ", ".join(z.states or [])} for z in partner.zones]
            p_dict["rates"] = [to_dict(r) for r in partner.zone_rates]
            p_dict["fuel_matrix"] = [to_dict(f) for f in partner.fuel_matrix]
            p_dict["oda_matrix"] = [to_dict(o) for o in partner.oda_matrix]

            return p_dict

    def get_partner_zones(self, partner_id):
        with SessionLocal() as session:
            zones = session.scalars(select(LogisticsZone).where(LogisticsZone.partner_id == partner_id)).all()
            
            zones_data = []
            state_map = {}

            for z in zones:
                zones_data.append({
                    "zone_code": z.zone_code,
                    "zone_name": z.zone_name,
                    "states": z.states or []
                })
                for s in (z.states or []):
                    state_map[s] = z.zone_code

            return {"zones": zones_data, "state_map": state_map}
    # --- LOGISTICS PARTNER end---

    # --- ITEM MASTERY start---
    def get_item_names(self):
        with SessionLocal() as session:
            stmt = (
                select(ItemMaster.item_name).where(ItemMaster.item_name.is_not(None), ItemMaster.item_name != "")
                .distinct()
                .order_by(ItemMaster.item_name)
            )   

            return list(session.execute(stmt).scalars().all())
        
    def get_item(self, item_code):
        with SessionLocal() as session:
            item = session.scalars(select(ItemMaster).where(ItemMaster.is_active == True, ItemMaster.item_code == item_code)).first()
            if not item:
                raise Exception("Item not found")
                
            item_dict = to_dict(item)
            item_dict['has_transactions'] = self.item_has_transactions(item_code)
            return item_dict
            
    def create_item(self, item_data: dict):
        with SessionLocal() as session:
            new_item = ItemMaster(
                item_code=item_data['item_code'].strip(),
                item_name=item_data['item_name'].strip(),
                item_group=item_data['item_group'].strip(),
                rate=item_data['rate'],
                unit_measure=item_data['unit_measure'].strip(),
                additional_spec_text=item_data['additional_spec_text'].strip(),
                hsn_code=item_data['hsn_code'].strip(),
                revision_no=item_data['revision_no'].strip(),
                available_stock=int(item_data['available_stock'])
            )
            session.add(new_item)
            session.commit()
            session.refresh(new_item)
            return to_dict(new_item)
    
    def update_item(self, item_code, data):
        used = self.item_has_transactions(item_code)
        with SessionLocal() as session:
            item = session.scalars(select(ItemMaster).where(ItemMaster.item_code == item_code)).first()
            if item:
                if used:
                    item.rate = data.get("rate")
                    item.additional_spec_text = data.get("additional_spec_text")
                    item.revision_no = data.get("revision_no")
                else:
                    item.item_name = data.get("item_name")
                    item.item_group = data.get("item_group")
                    item.rate = data.get("rate")
                    item.unit_measure = data.get("unit_measure")
                    item.hsn_code = data.get("hsn_code")
                    item.additional_spec_text = data.get("additional_spec_text")
                    item.revision_no = data.get("revision_no")
                    item.available_stock = data.get("available_stock")
                session.commit()
            return to_dict(item)
        
    def disable_item(self, item_code):
        with SessionLocal() as session:
            item = session.scalars(select(ItemMaster).where(ItemMaster.item_code == item_code)).first()
            if item:
                item.is_active = False
                session.commit()
            return {"success": True}    
    
    def item_has_transactions(self, item_code):
        with SessionLocal() as session:
            stmt = select(select(OrderItem).where(OrderItem.item_code == item_code).exists())
            return session.scalar(stmt)
    
    def get_all_items(self):
        with SessionLocal() as session:
            items = session.scalars(select(ItemMaster)).all()
            return [to_dict(i) for i in items]

    def adjust_item_stock(self, item_code, operation, quantity, remarks, operator_email):
        with SessionLocal() as session:

            item = session.get(ItemMaster, item_code)
            
            if not item:
                raise ValueError("Item not found.")

            before = item.available_stock

            if operation == "add":
                after = before + quantity
                movement = quantity

            elif operation == "subtract":
                after = before - quantity
                movement = -quantity

            elif operation == "set":
                after = quantity
                movement = quantity - before

            else:
                raise ValueError("Invalid stock operation.")

            if after < 0:
                raise ValueError("Stock cannot become negative.")

            item.available_stock = after

            session.add(
                StockLedger(
                    item_code=item_code,
                    quantity_change=movement,
                    stock_before=before,
                    stock_after=after,
                    movement_type="ADJUSTMENT",
                    remarks=remarks,
                    operator_email=operator_email
                )
            )

            session.commit()

            return {"available_stock": after}

    def get_stock_ledger(self):
        with SessionLocal() as session:

            logs = (
                session.query(
                    StockLedger,
                    User.name.label("operator_name"),
                    ItemMaster.item_name.label("item_name")
                )
                .join(User, User.email == StockLedger.operator_email)
                .join(ItemMaster, ItemMaster.item_code == StockLedger.item_code)
                .order_by(StockLedger.created_at.desc())
                .all()
            )

            return [
                {
                    "id": log.id,
                    "created_at": log.created_at,
                    "item_code": log.item_code,
                    "item_name": item_name,
                    "movement_type": log.movement_type,
                    "quantity_change": log.quantity_change,
                    "stock_before": log.stock_before,
                    "stock_after": log.stock_after,
                    "remarks": log.remarks,
                    "operator": operator_name
                }
                for log, operator_name, item_name in logs
            ]
    # --- ITEM MASTERY end---
    
    # --- CONTEXTUAL ACCOUNTABILITY HUB (ACTIVITY LOGS) start---
    def get_activity_logs(self, entity_type: str, entity_id: str):
        with SessionLocal() as session:
            stmt = select(ActivityLog, User.name.label("operator_name"))\
                .outerjoin(User, ActivityLog.operator_email == User.email)\
                .where(ActivityLog.entity_type == entity_type, ActivityLog.entity_id == str(entity_id))\
                .order_by(ActivityLog.created_at.asc())
            
            results = session.execute(stmt).all()
            
            logs = []
            for log, operator_name in results:
                log_dict = to_dict(log)
                log_dict['operator_name'] = operator_name
                logs.append(log_dict)
            return logs

    def add_manual_activity_log(self, order_id: str, message: str, operator_email: str):
        with SessionLocal() as session:
            operator = (session.query(User).filter(User.email==operator_email).first())
            operator_name = operator.name if operator else None
            log = ActivityLog(
                entity_id=order_id,
                entity_type="ORDER", # Presumed contextual type
                log_type="MANUAL_ENTRY",
                message=message,
                operator_email=operator_email
            )
            session.add(log)
            session.commit()
            session.refresh(log)
            
            log_dict = to_dict(log)
            log_dict['operator_name'] = operator_name
            return log_dict

    def delete_activity_log(self, log_id: int, user_role: str):
        if user_role not in ['Admin', 'Chief Full Stack Developer']:
            raise ValueError("Only System Administrators can alter the audit trail.")
            
        with SessionLocal() as session:
            log = session.scalars(select(ActivityLog).where(ActivityLog.log_id == log_id)).first()
            if log:
                session.delete(log)
                session.commit()
            return True

    def create_activity_log(self, entity_type: str, entity_id: str, operator_email: str, log_type: str, message: str, metadata: dict = None):
        with SessionLocal() as session:
            log = ActivityLog(
                entity_type=entity_type,
                entity_id=str(entity_id),
                operator_email=operator_email,
                log_type=log_type,
                message=message,
                metadata=metadata
            )
            session.add(log)
            session.commit()
            session.refresh(log)
            return to_dict(log)
    
    def get_dashboard_activity_tree(self):
        with SessionLocal() as session:
            # Load Orders
            orders = session.scalars(select(OrderHeader).order_by(OrderHeader.due_date.asc())).all()
            
            # Load Logs with users
            stmt = select(ActivityLog, User.name.label("operator_name"))\
                .outerjoin(User, ActivityLog.operator_email == User.email)\
                .where(ActivityLog.entity_type == 'ORDER')\
                .order_by(ActivityLog.created_at.desc())
            
            log_results = session.execute(stmt).all()
            
            logs_by_order = {}
            for log, operator_name in log_results:
                log_dict = to_dict(log)
                log_dict['operator_name'] = operator_name
                eid = log.entity_id
                if eid not in logs_by_order:
                    logs_by_order[eid] = []
                logs_by_order[eid].append(log_dict)

            dashboard_tree = {"past": [], "ongoing": [], "future": []}
            today = date.today()

            for order in orders:
                order_dict = to_dict(order)
                oid = str(order.order_acceptance_id)
                order_dict['logs'] = logs_by_order.get(oid, [])

                due = order.due_date
                acc = order.order_acceptance_date
                
                if due and due < today:
                    cat = 'past'
                elif acc and acc > today:
                    cat = 'future'
                else:
                    cat = 'ongoing'
                    
                dashboard_tree[cat].append(order_dict)

            return dashboard_tree
    # --- CONTEXTUAL ACCOUNTABILITY HUB (ACTIVITY LOGS) end---

    # --- CRM SUBSYSTEM start ---
    def get_crm_leads(self, user_profile: dict):
        with SessionLocal() as session:
            if user_profile['role'] in ['Admin', 'Chief Full Stack Developer']:
                stmt = select(CRMLead).order_by(CRMLead.created_at.desc())
            else:
                stmt = select(CRMLead).where(CRMLead.assigned_to == user_profile['email']).order_by(CRMLead.created_at.desc())
            
            leads = session.scalars(stmt).all()
            return [to_dict(l) for l in leads]

    def update_crm_lead_status(self, lead_id: int, status: str):
        with SessionLocal() as session:
            lead = session.scalars(select(CRMLead).where(CRMLead.id == lead_id)).first()
            if lead:
                lead.status = status
                session.commit()
                return {"id": lead.id}
            return None

    def create_crm_lead(self, lead_data: dict):
        with SessionLocal() as session:
            lead = CRMLead(
                full_name=lead_data['full_name'],
                designation=lead_data.get('designation'),
                company_name=lead_data.get('company_name'),
                contact_email=lead_data['contact_email'],
                phone_number=lead_data.get('phone_number'),
                city_state=lead_data['city_state'],
                product_query=lead_data.get('product_query'),
                gdpr_consent=lead_data.get('gdpr_consent', False),
                assigned_region=lead_data.get('assigned_region'),
                assigned_to=lead_data.get('assigned_to')
            )
            session.add(lead)
            session.commit()
            return lead.id

    def get_sales_regions(self):
        with SessionLocal() as session:
            # Querying distinct unnested array fields in SQLAlchemy directly mapping to Postgres functionality
            stmt = select(func.unnest(User.regions).label("region_name")).distinct()
            regions = session.scalars(stmt).all()
            return [{"zone_code": r, "zone_name": r} for r in regions if r]
    # --- CRM SUBSYSTEM end ---

    # --- GRN SUBSYSTEM start ---
    def create_grn(self, grn_data: dict, operator_email: str):
        with SessionLocal() as session:
            header = GRNHeader(
                grn_number=grn_data["grn_number"],
                vendor_name=grn_data.get("vendor_name"),
                operator_email=operator_email
            )
            session.add(header)
            session.flush() # get id

            for item in grn_data["items"]:
                gi = GRNItem(
                    grn_id=header.id,
                    item_code=item["item_code"],
                    quantity=item["quantity"],
                    rate=item["rate"],
                    amount=float(item["quantity"]) * float(item["rate"])
                )
                session.add(gi)
                header.items.append(gi)

            session.commit()
            return {"grn_id": header.id, "grn_number": header.grn_number}

    def get_grn_by_id(self, grn_id: int):
        with SessionLocal() as session:
            header = session.scalars(select(GRNHeader).options(joinedload(GRNHeader.items)).where(GRNHeader.id == grn_id)).unique().first()
            
            if not header:
                return None

            h_dict = to_dict(header)
            items = []
            subtotal = 0.0
            
            for i in header.items:
                i_dict = to_dict(i)
                subtotal += i_dict.get('amount', 0.0)
                items.append(i_dict)
                
            return {
                "id": header.id,
                "grn_number": header.grn_number,
                "vendor_name": header.vendor_name,
                "invoice_date": str(header.receipt_date),
                "items": items,
                "subtotal": subtotal
            }
    # --- GRN SUBSYSTEM end ---
    
    # --- Testing START ---
    def seed_test_items(self, items_list: list):
        with SessionLocal() as session:
            for item in items_list:
                # Assuming additional_spec_text maps to item_specification from dicts
                stmt = pg_insert(TestItemMaster).values(
                    item_code=item['item_code'],
                    additional_spec_text=item.get('item_specification')
                ).on_conflict_do_nothing(index_elements=['item_code'])
                session.execute(stmt)
            session.commit()
    
    def get_test_items(self):
        with SessionLocal() as session:
            items = session.scalars(select(TestItemMaster)).all()
            return [to_dict(i) for i in items]
    
    def get_test_item_by_code(self, item_code: str):
        with SessionLocal() as session:
            item = session.scalars(select(TestItemMaster).where(TestItemMaster.item_code == item_code)).first()
            return to_dict(item)
    # --- Testing END ---

    # --- Companies START ---
    def get_all_companies(self):
        with SessionLocal() as session:
            comps = session.scalars(select(ClientCompany).order_by(ClientCompany.name)).all()
            return [to_dict(c) for c in comps]
    
    def get_company(self, company_id: str):
        with SessionLocal() as session:
            comp = session.scalars(select(ClientCompany).where(ClientCompany.id == company_id)).first()
            return to_dict(comp)

    def create_company(self, company_data: dict):
        with SessionLocal() as session:
            total = session.scalar(select(func.count()).select_from(ClientCompany))
            company_id = f"C{str(total + 1).zfill(3)}"

            comp = ClientCompany(
                id=company_id,
                name=company_data["name"].strip(),
                address_line_1=company_data["address_line_1"].strip(),
                city=company_data["city"],
                state=company_data["state"],
                pincode=company_data["pincode"],
                contact_name=company_data["contact_name"].strip(),
                contact_role=company_data["contact_role"],
                contact_phone=company_data["contact_phone"]
            )
            session.add(comp)
            session.commit()
            session.refresh(comp)
            return to_dict(comp)

    def update_company(self, company_id: str, company_data: dict):
        with SessionLocal() as session:
            comp = session.scalars(select(ClientCompany).where(ClientCompany.id == company_id)).first()
            if comp:
                for field, value in company_data.items():
                    if value is not None and hasattr(comp, field):
                        setattr(comp, field, value)
                comp.updated_at = func.now()
                session.commit()
            return to_dict(comp)
            
    def delete_company(self, company_id: str):
        with SessionLocal() as session:
            comp = session.scalars(select(ClientCompany).where(ClientCompany.id == company_id)).first()
            if comp:
                session.delete(comp)
                session.commit()
            return to_dict(comp)
            
    def search_companies(self, q: str):
        with SessionLocal() as session:
            search = f"%{q}%"
            stmt = select(ClientCompany).where(
                or_(
                    ClientCompany.name.ilike(search),
                    ClientCompany.id.ilike(search)
                )
            ).order_by(ClientCompany.name).limit(10)
            comps = session.scalars(stmt).all()
            return [to_dict(c) for c in comps]
    # --- Companies END ---

    # --- LEAD GENERATOR ENGINE start ---
    def request_lead_target(self, company_name: str, domain: str, operator_email: str):
        with SessionLocal() as session:
            safe_domain = domain.strip().lower() if domain else ""
            target = LeadTarget(
                company_name=company_name.strip(),
                domain=safe_domain,
                requested_by=operator_email
            )
            session.add(target)
            session.commit()
            session.refresh(target)
            return to_dict(target)

    def get_lead_targets(self, operator_email: str = None, role: str = "Admin"):
        with SessionLocal() as session:
            if role in ["Admin", "Chief Full Stack Developer"]:
                stmt = select(LeadTarget).order_by(LeadTarget.created_at.desc())
            else:
                stmt = select(LeadTarget).where(
                    LeadTarget.requested_by == operator_email,
                    LeadTarget.status != 'Inactives'
                ).order_by(LeadTarget.created_at.desc())
            
            targets = session.scalars(stmt).all()
            return [to_dict(t) for t in targets]

    def get_lead_contacts(self, target_id: int):
        with SessionLocal() as session:
            stmt = select(LeadContact).where(LeadContact.target_id == target_id).order_by(
                LeadContact.is_priority.desc(), LeadContact.full_name.asc()
            )
            contacts = session.scalars(stmt).all()
            return [to_dict(c) for c in contacts]

    def mock_overnight_sync(self, target_id: int):
        import random
        roles = [
            ("Purchase Manager", True), ("QA/QC Head", True), ("Production Supervisor", True), 
            ("Procurement Executive", True), ("Marketing Associate", False), ("HR Manager", False), 
            ("Software Engineer", False), ("Accounts Payable", False)
        ]
        
        with SessionLocal() as session:
            target = session.scalars(select(LeadTarget).where(LeadTarget.id == target_id)).first()
            if not target: return False
            
            target.status = 'Completed'
            domain = target.domain
            
            for i in range(random.randint(3, 8)):
                role, is_priority = random.choice(roles)
                contact = LeadContact(
                    target_id=target_id,
                    full_name=f"Mock User {i+1}",
                    designation=role,
                    email=f"user{i+1}@{domain}",
                    is_priority=is_priority
                )
                session.add(contact)
                
            session.commit()
            return True

    def bulk_insert_targets(self, dataframe, operator_email):
        inserted = 0
        failed = []

        with SessionLocal() as session:
            for index, row in dataframe.iterrows():
                company = str(row["Company Name"]).strip()
                domain = str(row["Domain"]).strip().lower()
                
                try:
                    target = LeadTarget(
                        company_name=company,
                        domain=domain,
                        requested_by=operator_email
                    )
                    session.add(target)
                    session.commit()
                    inserted += 1
                except Exception as e:
                    session.rollback()
                    failed.append({"row": index + 2, "company": company, "reason": str(e)})

        return {"inserted": inserted, "failed": failed, "total": len(dataframe)}
    
    def update_lead_target(self, target_id: int, company_name: str, domain: str, user_email: str, user_role: str):
        with SessionLocal() as session:
            stmt = select(LeadTarget).where(LeadTarget.id == target_id)
            if user_role not in ['Admin', 'Chief Full Stack Developer']:
                stmt = stmt.where(LeadTarget.requested_by == user_email)
                
            target = session.scalars(stmt).first()
            if not target:
                raise ValueError("Target not found or unauthorized.")
                
            target.company_name = company_name.strip()
            target.domain = domain.strip().lower() if domain else ""
            session.commit()
            return to_dict(target)
                
    def delete_lead_target(self, target_id: int, user_role: str):
        if user_role not in ['Admin', 'Chief Full Stack Developer']:
            raise ValueError("Unauthorized action.")
            
        with SessionLocal() as session:
            target = session.scalars(select(LeadTarget).where(LeadTarget.id == target_id)).first()
            if not target:
                raise ValueError("Target not found or unauthorized.")
                
            session.delete(target)
            session.commit()
            return {"id": target_id}

    def deactivate_lead_target(self, target_id: int, user_email: str, user_role: str):
        with SessionLocal() as session:
            target = session.scalars(select(LeadTarget).where(LeadTarget.id == target_id, LeadTarget.requested_by == user_email)).first()
            if not target:
                raise ValueError("Target not found or unauthorized.")
                
            target.status = 'Inactivates'
            session.commit()
            return {"id": target.id}
    
    def reject_lead_target(self, target_id: int, rejected_reason: str = None):
        with SessionLocal() as session:
            target = session.scalars(select(LeadTarget).where(LeadTarget.id == target_id)).first()
            if not target:
                raise ValueError("Target not found.")
                
            target.status = 'Rejected'
            # Assuming 'rejected_reason' might be handled in a different field or schema since it's missing in the provided LeadTarget model.
            # You can map it into a metadata field or text column if needed.
            session.commit()
            return {"id": target.id}
    # --- LEAD GENERATOR ENGINE end ---
    # --- GLOBAL PRODUCTION PULSE start ---
    def get_global_production_pulse(self, user):
        with SessionLocal() as session:
            stmt = (select(OrderHeader).options(selectinload(OrderHeader.items)).order_by(OrderHeader.due_date.asc()))
            
            if user["role"] not in ["Admin", "Chief Full Stack Developer", "Shop Floor Administrator", "Dispatch Engineer"]:
                stmt = stmt.where(OrderHeader.ordered_by == user["email"])
            
            orders = session.scalars(stmt).unique().all()

            result = []

            for order in orders:
                order_dict = to_dict(order)
                order_dict["items"] = [to_dict(item) for item in order.items]
                result.append(order_dict)
            return result
        
    def update_order_stage(self, order_id: str, new_stage: str):
        
        with SessionLocal() as session:
            stmt = (update(OrderHeader).where(OrderHeader.order_acceptance_id == str(order_id)).values(production_stage=new_stage))

            order = session.execute(stmt).scalar_one_or_none()

            session.commit()

            return to_dict(order)
    # --- GLOBAL PRODUCTION PULSE end ---
    # --- SYSTEM AUDIT start ---
    def log_system_action(self, user_email: str, user_name: str, route_path: str):
        with SessionLocal() as session:
            log = SystemAuditLog(user_email=user_email, user_name=user_name, action_route=route_path)
            session.add(log)
            session.commit()
    # --- SYSTEM AUDIT end ---
    # --- FAQ Engine start ---
    def create_faq_query(self, question: str, asked_by: str):
        with SessionLocal() as session:
            faq = FAQQuery(question=question.strip(), asked_by=asked_by)

            session.add(faq)
            session.commit()
            session.refresh(faq)

            return to_dict(faq)
    
    def get_faq_queries(self):
        with SessionLocal() as session:
            stmt = select(FAQQuery).order_by(FAQQuery.created_at.desc())

            faqs = session.scalars(stmt).all()

            return [to_dict(f) for f in faqs]
    
    def answer_faq_query(self, faq_id: int, answer: str, answered_by: str):
        with SessionLocal() as session:
            faq = session.get(FAQQuery, faq_id)

            if not faq:
                raise ValueError("FAQ not found.")

            faq.answer = answer.strip()
            faq.answered_by = answered_by
            faq.status = "Answered"

            session.commit()
            session.refresh(faq)

            return to_dict(faq)
    # --- FAQ Engine end ---
    # --- SYSTEM LOGS start ---
    def create_system_notification(self, user_email: str, title: str, message: str, notif_type: str):
        with SessionLocal() as session:
            notification = SystemNotification(user_email=user_email, title=title, message=message, type=notif_type)

            session.add(notification)
            session.commit()


    def get_system_errors(self, from_date, to_date):
        with SessionLocal() as session:
            stmt = (select(SystemErrorLog).order_by(SystemErrorLog.created_at.desc()).where(SystemErrorLog.created_at.between(from_date, to_date)).limit(50))

            errors = session.scalars(stmt).all()

            return [
                {
                    **to_dict(error),
                    "created_at": error.created_at.isoformat()
                }
                for error in errors
            ]
    # --- SYSTEM LOGS end ---
    # --- SALES ANALYTICS & KPIs start ---
    def get_sales_kpis(self, from_date, to_date):
        with SessionLocal() as session:

            users = session.scalars(select(User).where(User.role == "Sales Representative")).all()

            result = []

            for user in users:

                total_spend = session.scalar(select(func.coalesce(func.sum(LeadTarget.cost_per_credit), 0)).where(LeadTarget.requested_by == user.email, LeadTarget.added_date.between(from_date, to_date)))

                targets_queued = session.scalar(select(func.count()).select_from(LeadTarget).where(LeadTarget.requested_by == user.email,LeadTarget.status != "Inactive", LeadTarget.added_date.between(from_date, to_date)))

                order_value = session.scalar(select(func.coalesce(func.sum(OrderItem.amount),0)).select_from(OrderHeader).join(OrderItem,OrderItem.order_acceptance_id ==OrderHeader.order_acceptance_id).where(OrderHeader.ordered_by == user.email, OrderHeader.created_at.between(from_date, to_date)))

                rejected = session.scalar(select(func.count()).select_from(LeadTarget).where(LeadTarget.requested_by == user.email, LeadTarget.status == "Rejected", LeadTarget.added_date.between(from_date, to_date)))

                inactive = session.scalar(select(func.count()).select_from(LeadTarget).where(LeadTarget.requested_by == user.email, LeadTarget.status == "Inactive", LeadTarget.added_date.between(from_date, to_date)))

                crm_leads = session.scalar(select(func.count()).select_from(CRMLead).where(CRMLead.assigned_to == user.email, CRMLead.created_at.between(from_date, to_date)))

                faqs = session.scalar(select(func.count()).select_from(FAQQuery).where(FAQQuery.asked_by == user.email, FAQQuery.created_at.between(from_date, to_date)))

                dispatches = session.scalar(select(func.count()).select_from(DispatchRecord).where(DispatchRecord.operator_email == user.email, DispatchRecord.created_at.between(from_date, to_date)))

                actions = session.scalar(select(func.count()).select_from(SystemAuditLog).where(SystemAuditLog.user_email == user.email, SystemAuditLog.created_at.between(from_date, to_date)))

                quotations = session.scalar(select(func.count()).select_from(Quotation).where(Quotation.sales_user_email == user.email, Quotation.generated_at.between(from_date, to_date)))
                
                performance_score = (float(order_value or 0) / 1000 + (crm_leads * 10) + (dispatches * 8) + (faqs * 3) + actions)


                result.append({
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "quarterly_order_value_target": float(user.quarterly_order_value_target or 0),
                    "total_spend": float(total_spend or 0),

                    "targets_queued": targets_queued,

                    "monthly_order_value": float(order_value or 0),

                    "rejected": rejected,

                    "inactive": inactive,

                    "total_crm_leads": crm_leads,

                    "faqs_asked": faqs,

                    "dispatches_logged": dispatches,

                    "actions_logged": actions,

                    "quotations": quotations,

                    "performance_score": performance_score
                })


            return sorted(result, key=lambda x: x["performance_score"], reverse=True)
    
    def get_rnd_kpis(self, from_date, to_date):
        with SessionLocal() as session:

            users = session.scalars(select(User).where(User.role=="R&D Engineer")).all()

            output=[]

            for user in users:

                answered=session.scalar(select(func.count()).select_from(FAQQuery).where(FAQQuery.answered_by==user.email, FAQQuery.created_at.between(from_date, to_date)))

                resolved=session.scalar(select(func.count()).select_from(FAQQuery).where(FAQQuery.answered_by==user.email,FAQQuery.status=="Answered", FAQQuery.updated_at.between(from_date, to_date)))

                actions=session.scalar(select(func.count()).select_from(SystemAuditLog).where(SystemAuditLog.user_email==user.email, SystemAuditLog.created_at.between(from_date, to_date)))


                output.append({
                    "email":user.email,
                    "name":user.name,
                    "role":user.role,
                    "faqs_answered":answered,
                    "resolved":resolved,
                    "actions_logged":actions,
                    "knowledge_score": answered*15 + resolved*25 + actions
                })

            return sorted(output, key=lambda x:x["knowledge_score"], reverse=True)
        
    def get_transport_kpis(self, from_date, to_date):

        with SessionLocal() as session:

            total_partners=session.scalar(select(func.count(LogisticsPartner.id)))


            monthly = session.execute(select(func.to_char(DispatchRecord.created_at, "YYYY-MM").label("month_period"),
                                             func.count(DispatchRecord.id).label("total_dispatches"),
                                             func.sum(DispatchRecord.dispatch_cost_gst).label("total_cost"))
                                             .where(DispatchRecord.created_at.between(from_date, to_date))
                                             .group_by(func.to_char(DispatchRecord.created_at, "YYYY-MM"))
                                             .order_by(desc("month_period"))).all()

            dispatches = session.scalars(select(DispatchRecord).where(DispatchRecord.created_at.between(from_date, to_date))
                                         .order_by(DispatchRecord.created_at.desc())).all()

            dispatch_records = {}

            for d in dispatches:
                month = d.created_at.strftime("%Y-%m")

                dispatch_records.setdefault(month, []).append({
                    "id": d.id,
                    "partner_name": d.partner_name,
                    "destination_zone": d.destination_zone,
                    "chargeable_weight": float(d.chargeable_weight or 0),
                    "basic_freight": float(d.basic_freight or 0),
                    "fuel_charge": float(d.fuel_charge or 0),
                    "oda_charge": float(d.oda_charge or 0),
                    "fov_charge": float(d.fov_charge or 0),
                    "loading_charges": float(d.loading_charge or 0),
                    "hamali_cost": float(d.hamali_cost or 0),
                    "subtotal": float(d.subtotal or 0),
                    "gst": float(d.dispatch_cost_gst or 0),
                    "operator": d.operator_email,
                    "created_at": d.created_at.strftime("%d-%b-%Y")
                })

            total_dispatches = sum(m.total_dispatches for m in monthly)

            total_cost = sum(float(m.total_cost or 0) for m in monthly)

            partner_distribution = session.execute(select(DispatchRecord.partner_name, func.count().label("dispatches"))
                                                   .group_by(DispatchRecord.partner_name)).all()
            partner_distribution =  [{"partner": row.partner_name, "dispatches": row.dispatches} for row in partner_distribution]

            return {
                "total_partners": total_partners,
                "total_dispatches": total_dispatches,
                "total_cost": total_cost,
                "average_dispatch_cost": round(total_cost / total_dispatches, 2) if total_dispatches else 0,

                "monthly_costs":[
                    {
                        "month_period":m.month_period,
                        "total_dispatches":m.total_dispatches,
                        "total_cost":float(m.total_cost or 0)
                    }
                    for m in monthly
                ],

                "dispatch_records": dispatch_records,
                "partner_distribution": partner_distribution,
            }
    
    def get_production_analytics(self, from_date, to_date):
        with SessionLocal() as session:
            stages = session.execute(select(
                    func.coalesce(OrderHeader.production_stage, "PO_SUBMITTED").label("stage"),
                    func.count(OrderHeader.order_acceptance_id).label("order_count")
                )
                .where(OrderHeader.created_at.between(from_date, to_date))
                .group_by(OrderHeader.production_stage)
                .order_by(desc("order_count"))
            ).all()

            task_summary = session.execute(select(User.name.label("operator"), 

                func.count(Task.id).filter(Task.assigned_by == User.email).label("assigned"),

                func.count(Task.id).filter(User.email == func.any(Task.assigned_to)).label("received")

            )
            .where(or_(User.role == "Shop Floor Administrator", User.role == "Admin", User.role == "Chief Full Stack Developer"))
            .group_by(User.email, User.name)
            .order_by(User.name)

            ).all()
            
            completed_daily = session.execute(
                select(
                    func.date(Task.completed_at).label("day"),
                    func.count(Task.id).label("completed"),
                )
                .where(
                    Task.completed_at.is_not(None),
                    Task.completed_at.between(from_date, to_date)
                )
                .group_by(func.date(Task.completed_at))
                .order_by(func.date(Task.completed_at))
            ).all()

            
            return {
                "production_stage": [
                    {
                        "stage": r.stage,
                        "count": r.order_count
                    }
                    for r in stages
                ],

                "task_summary":[
                    {
                        "operator": r.operator,
                        "assigned": r.assigned,
                        "received": r.received
                    }
                    for r in task_summary
                ],

                "daily_completed": [
                    {
                        "day": str(r.day),
                        "completed": r.completed
                    }
                    for r in completed_daily
                ]
            }
    
    def get_gtm_analytics(self, from_date, to_date):
        with SessionLocal() as session:

            month_expr = func.to_char(LeadTarget.added_date, "YYYY-MM")

            # Scalar subqueries (same semantics as your SQL)
            total_queued = (select(func.count()).select_from(LeadTarget).where(LeadTarget.status != "Inactive", LeadTarget.created_at.between(from_date, to_date)).scalar_subquery())

            total_completed = (select(func.count()).select_from(LeadTarget).where(LeadTarget.status == "Completed", LeadTarget.created_at.between(from_date, to_date)).scalar_subquery())

            stmt = (select(LeadTarget.gtm_source.label("gtm_source"), month_expr.label("month"), func.count().label("total_targets"), func.count().filter(LeadTarget.status == "Completed").label("completed"), func.count().filter(LeadTarget.status == "Rejected").label("rejected"), func.count().filter(LeadTarget.status == "Pending").label("pending"), func.count().filter(LeadTarget.status == "Awaiting Review").label("awaiting_review"), func.sum(LeadTarget.cost_per_credit).label("total_spend"), func.sum(LeadTarget.emails_found).label("emails_found"), total_queued.label("total_queued"), total_completed.label("total_completed"), func.count(case(
                            (LeadTarget.email_status.in_(["Sent Email", "Got Reply", "Closed Enquiry", ]),1,))).label("emails_sent"),

                    func.count(case((LeadTarget.email_status == "Got Reply", 1,))).label("replies_received"),

                    func.count(case((LeadTarget.email_status == "Closed Enquiry",1,))).label("deals_closed"),
                )
                .where(LeadTarget.added_date.between(from_date, to_date))
                .group_by(LeadTarget.gtm_source, month_expr,)
                .order_by(month_expr.desc(),LeadTarget.gtm_source.asc(),)
            )

            rows = session.execute(stmt).mappings().all()

            return [
                {
                    **row,
                    "total_spend": float(row["total_spend"] or 0),
                    "emails_found": int(row["emails_found"] or 0),
                }
                for row in rows
            ]

    def get_today_quotation_analytics(self):
        today = date.today()

        start_of_day = datetime.combine(today, time.min)
        end_of_day = datetime.combine(today, time.max)

        stmt = (
            select(Quotation)
            .where(
                Quotation.generated_at >= start_of_day,
                Quotation.generated_at <= end_of_day,
                Quotation.is_active.is_(True),
            )
            .order_by(Quotation.generated_at.asc())
        )

        with SessionLocal() as session:
            quotations = session.execute(stmt).scalars().all()

        return quotations
    

    def get_today_quotation_summary(self):
        quotations = self.get_today_quotation_analytics()

        summary = {
            "total": len(quotations),
            "dealer_quotes": sum(
                1 for q in quotations if q.is_dealer
            ),
            "special_model_quotes": sum(
                1 for q in quotations if q.is_special_model
            ),
            "standard_model_quotes": sum(
                1 for q in quotations if not q.is_special_model
            ),
            "by_sales_user": {},
            "by_product": {},
        }

        for quotation in quotations:

            sales_user = quotation.sales_user_name or "Unknown"

            summary["by_sales_user"].setdefault(sales_user, {
                "email": quotation.sales_user_email,
                "count": 0,
            })

            summary["by_sales_user"][sales_user]["count"] += 1

            product = quotation.product_name or "Unknown"

            summary["by_product"][product] = (
                summary["by_product"].get(product, 0) + 1
            )

        return {
            "date": date.today(),
            "quotations": quotations,
            "summary": summary,
        }
    
    # --- SALES ANALYTICS & KPIs end ---
    # --- Geo repository start --- 
    def get_state_summary(self, from_date, to_date, items=None, role=None):
        print("The current role is: ", role)
        with SessionLocal() as session:
            if role in ["Admin", "Sales Representative", "Chief Full Stack Developer"]:
                stmt = (select(
                    BillHeader.indian_state.label("state"),
                    func.count(func.distinct(BillHeader.bill_num)).label("shipments"),
                    func.sum(BillItem.amount).label("revenue"),
                    func.sum(BillItem.quantity_shipped).label("quantity"),

                ).join(BillItem)
                .where(BillHeader.bill_date.between(from_date, to_date)))

                if items:
                    stmt = stmt.where(BillItem.item_code.in_(items))

                stmt = stmt.group_by(BillHeader.indian_state)

                rows = session.execute(stmt).mappings().all()

                return [{
                    "state": row["state"],
                    "shipments": int(row["shipments"] or 0),
                    "revenue": float(row["revenue"] or 0),
                    "quantity": float(row["quantity"] or 0),
                    "source": "bill_headers",
                    }
                    for row in rows
                ]

            if role=="Dispatch Engineer":
                stmt = (
                   select(DispatchRecord.indian_state.label("state"),
                        func.count(DispatchRecord.id).label("shipments"),

                        func.coalesce(func.sum(DispatchRecord.dispatch_cost_gst),0).label("revenue"),

                        func.coalesce(func.sum(DispatchRecord.chargeable_weight),0).label("quantity"),
                    )
                    .where(func.date(DispatchRecord.created_at).between(from_date,to_date,))
                )

                stmt = stmt.group_by(DispatchRecord.indian_state)

                rows = session.execute(stmt).mappings().all()
                
                return [{
                    "state": row["state"],
                    "shipments": int(row["shipments"] or 0),
                    "revenue": float(row["revenue"] or 0),
                    "quantity": float(row["quantity"] or 0),
                    "source": "dispatch_records",
                    }
                    for row in rows
                ]
            raise PermissionError(f"Role'{role}' is not permitted to access")
    # --- Geo repository end ---
    # --- Quotations start ---
    def create_quotation(self, request, sales_user, document_path=None):
        quotation = Quotation(quote_number=request.qoute_number,
        product_name=request.product_name,

        client_company=request.client_company,
        client_address_line1=request.client_address_line1,
        client_city=request.client_city,
        client_postal_code=request.client_postal_code,

        client_email=request.client_email,
        buyer_name=request.buyer_name,
        buyer_phone_number=request.buyer_phone_number,

        enquiry_date=request.date_input,

        supply=request.supply,
        installation=request.installation,
        freight=request.freight,

        is_dealer=request.dealer,
        is_special_model=request.special_model,
        special_itinerary=request.special_itinerary,

        sales_user_name=sales_user["name"],
        sales_user_email=sales_user["email"],

        document_path=str(document_path) if document_path else None,
        )

        self.db.add(quotation)
        self.db.commit()
        self.db.refresh(quotation)

        return quotation

    def get_quotation(self, quotation_id: int):
        return(self.db.query(Quotation).filter(Quotation.id == quotation_id, Quotation.is_active.is_(True), ).first())

    def get_quotation_number(self, quotation_num: str):
        return(self.db.query(Quotation).filter(Quotation.quote_number == quotation_num, Quotation.is_active.is_(True),).first())

    def get_quotations(self, skip: int=0, limit: int=100):
        return(self.db.query(Quotation)
               .filter(Quotation.is_active.is_(True))
               .order_by(Quotation.generated_at.desc())
               .offset(skip)
               .limit(limit)
               .all()
               )

    def update_quotation(self, quotation_id: int, updates: dict):
        quotation = self.get_quotation(quotation_id)

        if not quotation:
            return None

        allowed_fields = {
            "product_name",
            "client_company",
            "client_address_line1",
            "client_city",
            "client_postal_code",
            "client_email",
            "buyer_name",
            "buyer_phone_number",
            "enquiry_date",
            "supply",
            "installation",
            "freight",
            "is_dealer",
            "is_special_model",
            "special_itinerary",
            "document_path",
        }

        for field, value in updates.items():
            if field in allowed_fields:
                setattr(quotation, field, value)

        self.db.commit()
        self.db.refresh(quotation)

        return quotation

    def deactivate_quotation(self, quotation_id: int):
        quotation = self.get_quotation(quotation_id)

        if not quotation:
            return None

        quotation.is_active = False

        self.db.commit()
        self.db.refresh(quotation)

        return quotation

    def get_quotation_count_by_product(self):
        results = (
            self.db.query(Quotation.product_name,
                          func.count(Quotation.id).label("quotation_count"),
                          )
                          .filter(Quotation.is_active.is_(True))
                          .group_by(Quotation.product_name)
                          .order_by(func.count(Quotation.id).desc())
                          .all()
        )

        return [{
            "product_name": row.product_name,
            "quotation_count": row.quotation_count,
        } for row in results
        ]

    def get_special_model_analytics(self):
        standard = (
            self.db.query(func.count(Quotation.id))
            .filter(Quotation.is_active.is_(True), Quotation.is_special_model.is_(False),)
            .scalar()
            or 0
        )

        special = (
            self.db.query(func.count(Quotation.id))
            .filter(Quotation.is_active.is_(True), Quotation.is_special_model.is_(True),)
            .scalar()
            or 0
        )

        return {
            "standard_models": standard,
            "special_models": special,
        }

    def get_dealer_analytics(self):
        dealer = (
            self.db.query(func.count(Quotation.id))
            .filter(Quotation.is_active.is_(True), Quotation.is_dealer.is_(True))
            .scalar()
            or 0
        )

        non_dealer = (
            self.db.query(func.count(Quotation.id))
            .filter(Quotation.is_active.is_(True), Quotation.is_dealer.is_(False))
            .scalar()
            or 0
        )

        return {
            "dealer": dealer,
            "non_dealer": non_dealer,
        }

    # --- Quotations end ---
EDBR = PostgresRepository()