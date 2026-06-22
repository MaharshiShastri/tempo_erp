import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
from schemas.logistics_schema import FullPartnerProfile
import logging
import os

USER = os.getenv("role", "")
PASSWORD = os.getenv("db_password", "")

DB_DSN = os.getenv("DATABASE_URL", f"postgresql://{USER}:{PASSWORD}@192.168.0.148:5432/tempo_erp")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)
logger.info(f"DB URI: {DB_DSN}")
# We keep companies and items mock arrays temporarily as requested until Phase 2
MOCK_COMPANIES = [
    {"id": "C001", "name": "Tata Power", "address": "Bombay House, Fort, Mumbai"},
    {"id": "C002", "name": "Reliance Industries", "address": "Maker Chambers IV, Nariman Point, Mumbai"}
]
"""
CREATE TABLE crm_leads (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    company_name VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    city_state VARCHAR(255) NOT NULL,
    product_query TEXT, 
    gdpr_consent BOOLEAN DEFAULT FALSE,
    assigned_region VARCHAR(100),
    assigned_to VARCHAR(255),
    status VARCHAR(50) DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE grn_headers (
    id SERIAL PRIMARY KEY,
    grn_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_name VARCHAR(255),
    receipt_date DATE DEFAULT CURRENT_DATE,
    operator_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grn_items (
    id SERIAL PRIMARY KEY,
    grn_id INT REFERENCES grn_headers(id) ON DELETE CASCADE,
    item_code VARCHAR(100),
    quantity NUMERIC(10,2),
    rate NUMERIC(10,2),
    amount NUMERIC(10,2) GENERATED ALWAYS AS (quantity * rate) STORED
);
"""
class PostgresRepository:
    def _get_connection(self):
        return psycopg2.connect(DB_DSN, cursor_factory=RealDictCursor)

    # --- AUTH & RBAC start---
    def get_user(self, email: str, password: str = None):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                if password:
                    cur.execute("SELECT * FROM users WHERE email = %s AND password_hash = %s", (email, password))
                    logger.info("Email ID:", email, "Password: ", password)                    
                else:
                    cur.execute("SELECT email, name, role, regions FROM users WHERE email = %s", (email,))
                return cur.fetchone()

    def get_all_users(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT email, name, role, regions, phone_business FROM users")
                return cur.fetchall()

    def create_user(self, user_data: dict):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO users (email, name, password_hash, role, dob, phone_personal, phone_business, regions)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING email, name, role
                """, (
                    user_data['email'], user_data['name'], user_data['password'], user_data['role'],
                    user_data.get('dob'), user_data.get('phone_personal'), user_data.get('phone_business'),
                    user_data.get('regions', [])
                ))
                conn.commit()
                return cur.fetchone()
            
    def update_user(self, email: str, user_data: dict):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # If a new password is provided, update it. Otherwise, leave the hash alone.
                if user_data.get('password'):
                    cur.execute("""
                        UPDATE users 
                        SET name=%s, password_hash=%s, role=%s, dob=%s, phone_personal=%s, phone_business=%s, regions=%s
                        WHERE email=%s RETURNING email, name, role
                    """, (user_data['name'], user_data['password'], user_data['role'], user_data.get('dob'), 
                          user_data.get('phone_personal'), user_data.get('phone_business'), user_data.get('regions', []), email))
                else:
                    cur.execute("""
                        UPDATE users 
                        SET name=%s, role=%s, dob=%s, phone_personal=%s, phone_business=%s, regions=%s
                        WHERE email=%s RETURNING email, name, role
                    """, (user_data['name'], user_data['role'], user_data.get('dob'), 
                          user_data.get('phone_personal'), user_data.get('phone_business'), user_data.get('regions', []), email))
                conn.commit()
                return cur.fetchone()

    def delete_user(self, email: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM users WHERE email=%s RETURNING email", (email,))
                conn.commit()
                return cur.fetchone()
    # --- AUTH & RBAC end---
    # --- GLOBAL ORDERS ENGINE start---
    def get_all_orders(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # 1. Fetch all parent headers
                cur.execute("SELECT * FROM order_headers ORDER BY created_at DESC")
                headers = cur.fetchall()
                
                for h in headers:
                    # Format dates for JSON
                    h['order_acceptance_id'] = str(h['order_acceptance_id'])
                    h['order_acceptance_date'] = str(h['order_acceptance_date']) if h['order_acceptance_date'] else None
                    h['purchase_order_date'] = str(h['purchase_order_date']) if h['purchase_order_date'] else None
                    h['due_date'] = str(h['due_date']) if h['due_date'] else None
                    h['created_at'] = h['created_at'].isoformat() if h['created_at'] else None
                    
                    # 2. Fetch nested child items for this specific order
                    cur.execute("SELECT * FROM order_items WHERE order_acceptance_id = %s", (h['order_acceptance_id'],))
                    items = cur.fetchall()
                    
                    # Ensure Postgres NUMERIC types are float-converted for JSON transit
                    for i in items:
                        i['rate'] = float(i['rate'])
                        i['discount_percentage'] = float(i['discount_percentage'])
                        i['amount'] = float(i['amount'])
                        
                    h['items'] = items
                    
                return headers

    def get_orders_for_user(self, user_profile: dict):
        department = user_profile.get('department')
        email = user_profile.get('email')

        with self._get_connection() as conn:
            with conn.cursor() as cur:
                if user_profile['role'] == 'Admin':
                    cur.execute("SELECT * FROM order_headers")
                else:
                    cur.execute("SELECT * FROM order_headers WHERE department=%s AND email=%s", (department, email))

                return cur.fetchall()
    def create_order(self, order_data: dict) -> dict:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # 1. Insert into Header Table
                cur.execute("""
                    INSERT INTO order_headers (order_acceptance_id, order_acceptance_date, purchase_order_number, 
                                        purchase_order_date, customer_code, payment_terms, billing_name, 
                                        billing_address, due_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
                """, (
                    str(order_data['order_acceptance_id']), order_data['order_acceptance_date'], order_data['purchase_order_number'],
                    order_data['purchase_order_date'], order_data['customer_code'], order_data.get('payment_terms', ''),
                    order_data['billing_name'], order_data['billing_address'], order_data['due_date']
                ))
                header = cur.fetchone()
                cur.execute("""
                    INSERT INTO activity_logs(entity_id, entity_type, message, log_type)
                    VALUES(%s, "ORDER_CREATED", %s, "INFO")
                    """, (header["order_acceptance_id"], f"New order {header['order_acceptance_id']} added to pipeline."))
                conn.commit()
                
                header['order_acceptance_id'] = str(header['order_acceptance_id'])

                # 2. Insert into Items Table iteratively
                inserted_items = []
                for item in order_data["items"]:
                    if not item.get("additional_spec_text") or not item["additional_spec_text"].strip():
                        raise ValueError("Specification text details cannot be left blank.")
                    
                    # Note: We don't calculate 'amount' in Python because your SQL schema uses GENERATED ALWAYS
                    cur.execute("""
                        INSERT INTO order_items (order_acceptance_id, item_code, additional_spec_text, hsn_code, quantity, rate, discount_percentage)
                        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *
                    """, (
                        header['order_acceptance_id'], item['item_code'], item['additional_spec_text'].strip(),
                        item.get('hsn_code', ''), item['quantity'], item['rate'], item.get('discount_percentage', 0.0)
                    ))
                    
                    inserted_item = cur.fetchone()
                    inserted_item['rate'] = float(inserted_item['rate'])
                    inserted_item['discount_percentage'] = float(inserted_item['discount_percentage'])
                    inserted_item['amount'] = float(inserted_item['amount'])
                    inserted_items.append(inserted_item)

                conn.commit()
                header['items'] = inserted_items
                return header
    # --- GLOBAL ORDERS ENGINE end---
    # --- GLOBAL BILLS ENGINE start---
    def get_all_bills(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM bill_headers ORDER BY created_at DESC")
                headers = cur.fetchall()
                
                for h in headers:
                    h['bill_date'] = str(h['bill_date']) if h['bill_date'] else None
                    h['created_at'] = h['created_at'].isoformat() if h['created_at'] else None
                    
                    # JOIN with order_items to get the item_code for the frontend UI
                    cur.execute("""
                        SELECT bi.*, oi.item_code 
                        FROM bill_items bi
                        JOIN order_items oi ON bi.order_item_id = oi.order_item_id
                        WHERE bi.bill_num = %s
                    """, (h['bill_num'],))
                    h['items'] = cur.fetchall()
                    
                return headers

    def create_bill(self, bill_data: dict) -> dict:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # 1. Insert Header
                cur.execute("""
                    INSERT INTO bill_headers (bill_num, bill_date, order_acceptance_id)
                    VALUES (%s, %s, %s) RETURNING *
                """, (bill_data['bill_num'], bill_data['bill_date'], str(bill_data['order_acceptance_id'])))
                header = cur.fetchone()

                # 2. Insert Items
                inserted_items = []
                for item in bill_data['items']:
                    cur.execute("""
                        INSERT INTO bill_items (bill_num, order_item_id, quantity_shipped)
                        VALUES (%s, %s, %s) RETURNING *
                    """, (header['bill_num'], item['order_item_id'], item['quantity_shipped']))
                    inserted_items.append(cur.fetchone())

                conn.commit()
                header['items'] = inserted_items
                header['bill_date'] = str(header['bill_date'])
                return header
    # --- GLOBAL BILLS ENGINE start---
    # --- TASK MANAGER SUBSYSTEM start---
    def get_tasks(self, user_email: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM tasks WHERE assigned_by = %s OR %s = ANY(assigned_to) ORDER BY created_at DESC
                """, (user_email, user_email))
                tasks = cur.fetchall()
                for t in tasks: t['created_at'] = t['created_at'].isoformat() if t['created_at'] else None
                return tasks

    def create_task(self, task_dict: dict, assigned_by: str) -> dict:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO tasks (title, details, direction, is_incomplete, assigned_by, assigned_to)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
                """, (task_dict['title'], task_dict['details'], task_dict['direction'], True, assigned_by, task_dict.get('assigned_to', [])))
                conn.commit()
                new_task = cur.fetchone()
                new_task['created_at'] = new_task['created_at'].isoformat()
                return new_task

    def toggle_task_status(self, task_id: int) -> dict:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE tasks SET is_incomplete = NOT is_incomplete WHERE id = %s RETURNING *", (task_id,))
                conn.commit()
                updated = cur.fetchone()
                updated['created_at'] = updated['created_at'].isoformat()
                return updated
    
    def create_dispatch_record(self, record: dict, operator_email: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO dispatch_records (
                        partner_name, destination_zone, chargeable_weight, 
                        basic_freight, fuel_charge, fov_charge, oda_charge, 
                        hamali_detail, hamali_cost, subtotal, dispatch_cost_gst,
                        operator_email
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (
                    record.get("partner_name"), record.get("destination_zone"),
                    record.get("chargeable_weight"), record.get("basic_freight"), record.get("fuel_charge"),
                    record.get("fov_charge"), record.get("oda_charge"), 
                    record.get("hamali_detail", ""), record.get("hamali_cost", 0),
                    record.get("subtotal"), record.get("dispatch_cost_gst"), operator_email
                ))
                conn.commit()
                return cur.fetchone()
            
    # --- TASK MANAGER SUBSYSTEM end---
    # --- LOGISTICS PARTNET start---
    def get_logistics_partners(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM logistics_partners ORDER BY name ASC")
                return cur.fetchall()
                
    # In repository.py
    def update_full_partner_profile(self, partner_id: int, p: FullPartnerProfile):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    # 1. Update the parent partner record (Changed bracket notation to dot notation)
                    cur.execute("""
                        UPDATE logistics_partners 
                        SET name=%s, cft_factor=%s, minimum_weight=%s, minimum_freight_value=%s, 
                            documentation_charge=%s, fov_percentage=%s, gst_percentage=%s
                        WHERE id=%s
                    """, (p.name, p.cft_factor, p.minimum_weight, p.minimum_freight_value, 
                            p.documentation_charge, p.fov_percentage, p.gst_percentage, partner_id))

                    # 2. THE WIPE - Delete all existing child matrices for this partner
                    cur.execute("DELETE FROM logistics_zones WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_zone_rates WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_fuel_matrix WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_oda_matrix WHERE partner_id=%s", (partner_id,))

                    # 3. THE REPLACE - Re-insert the fresh matrices from the UI (Changed p['key'] to p.key)
                    for z in p.zones:
                        cur.execute("INSERT INTO logistics_zones (partner_id, zone_code, zone_name, states) VALUES (%s, %s, %s, %s)",
                                    (partner_id, z.zone_code, z.zone_name, z.states))
                    for r in p.rates:
                        cur.execute("INSERT INTO logistics_zone_rates (partner_id, destination_zone, rate_per_kg) VALUES (%s, %s, %s)",
                                    (partner_id, r.destination_zone, r.rate_per_kg))
                    for f in p.fuel_matrix:
                        cur.execute("INSERT INTO logistics_fuel_matrix (partner_id, fuel_price_from, fuel_price_to, surcharge_percentage) VALUES (%s, %s, %s, %s)",
                                    (partner_id, f.fuel_price_from, f.fuel_price_to, f.surcharge_percentage))
                    for o in p.oda_matrix:
                        cur.execute("INSERT INTO logistics_oda_matrix (partner_id, km_from, km_to, weight_from, weight_to, oda_charge) VALUES (%s, %s, %s, %s, %s, %s)",
                                    (partner_id, o.km_from, o.km_to, o.weight_from, o.weight_to, o.oda_charge))

                    # 4. Commit the transaction ONLY if all inserts succeed
                    conn.commit()
                    
                    # Also fixed the return statement here
                    return {"partner_id": partner_id, "status": "updated", "partner_name": p.name}
                    
                except Exception as e:
                    # If ANY query fails, revert the database to its exact state before the update began
                    conn.rollback()
                    raise e
    
    def delete_partner(self, partner_id: int, operator_email: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    # 1. Fetch the partner name before deletion (for the UI response/logs)
                    cur.execute("SELECT name FROM logistics_partners WHERE id=%s", (partner_id,))
                    partner = cur.fetchone()
                    
                    if not partner:
                        return {"partner_id": partner_id, "status": "not_found"}
                        
                    partner_name = partner['name']

                    # 2. THE CASCADE WIPE - Delete all child matrices first
                    cur.execute("DELETE FROM logistics_zones WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_zone_rates WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_fuel_matrix WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_oda_matrix WHERE partner_id=%s", (partner_id,))

                    # 3. Delete the parent record
                    cur.execute("DELETE FROM logistics_partners WHERE id=%s", (partner_id,))

                    # 4. Commit the transaction ONLY if all deletions succeed
                    conn.commit()
                    
                    return {"partner_id": partner_id, "status": "deleted", "partner_name": partner_name}
                    
                except Exception as e:
                    # If any query fails, rollback to prevent partial deletions
                    conn.rollback()
                    raise e
                
                
    def create_full_partner_profile(self, p: FullPartnerProfile):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    # 1. Create Partner
                    cur.execute("""
                        INSERT INTO logistics_partners (name, partner_link, cft_factor, minimum_weight, minimum_freight_value, 
                                                        documentation_charge, fov_percentage, gst_percentage)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                    """, (p.name, p.partner_link, p.cft_factor, p.minimum_weight, p.minimum_freight_value, 
                          p.documentation_charge, p.fov_percentage, p.gst_percentage))
                    
                    row = cur.fetchone()
                    partner_id = row["id"] if row else None

                    # 2. Insert Zones
                    for z in p.zones:
                        cur.execute("INSERT INTO logistics_zones (partner_id, zone_code, zone_name, states) VALUES (%s, %s, %s, %s)",
                                    (partner_id, z.zone_code, z.zone_name, z.states))

                    # 3. Insert Rates
                    for r in p.rates:
                        cur.execute("INSERT INTO logistics_zone_rates (partner_id, destination_zone, rate_per_kg) VALUES (%s, %s, %s)",
                                    (partner_id, r.destination_zone, r.rate_per_kg))

                    # 4. Insert Fuel
                    for f in p.fuel_matrix:
                        cur.execute("INSERT INTO logistics_fuel_matrix (partner_id, fuel_price_from, fuel_price_to, surcharge_percentage) VALUES (%s, %s, %s, %s)",
                                    (partner_id, f.fuel_price_from, f.fuel_price_to, f.surcharge_percentage))

                    # 5. Insert ODA
                    for o in p.oda_matrix:
                        cur.execute("INSERT INTO logistics_oda_matrix (partner_id, km_from, km_to, weight_from, weight_to, oda_charge) VALUES (%s, %s, %s, %s, %s, %s)",
                                    (partner_id, o.km_from, o.km_to, o.weight_from, o.weight_to, o.oda_charge))

                    conn.commit()
                    return {"partner_id": partner_id, "status": "created", "partner_name": p.name}
                
                except Exception as e:
                    conn.rollback()
                    raise e
                
    def find_zone_by_state( self, partner_id, state):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT zone_code
                FROM logistics_zones
                WHERE partner_id=%s
                AND %s = ANY(states)
                LIMIT 1
            """, (partner_id, state ))
                
                row = cur.fetchone()

                return (row["zone_code"] if row else None)
        
    def get_zone_rate( self,  partner_id,destination_zone):
        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT rate_per_kg
                    FROM logistics_zone_rates
                    WHERE partner_id=%s
                    AND destination_zone=%s
                    LIMIT 1
                """, (partner_id, destination_zone ))

                row = cur.fetchone()

                return (row["rate_per_kg"] if row else None )
        
    def get_fuel_surcharge(self, partner_id, diesel_price ):
        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT surcharge_percentage
                    FROM logistics_fuel_matrix
                    WHERE partner_id=%s
                    AND fuel_price_from <= %s
                    AND fuel_price_to >= %s
                    LIMIT 1
                """, (partner_id, diesel_price, diesel_price ))

                row = cur.fetchone()
                print("Row found: ", row)
                return ( row["surcharge_percentage"] if row else 0 )
        
    def get_oda_charge(self, partner_id, kms, weight):
        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT oda_charge
                    FROM logistics_oda_matrix
                    WHERE partner_id=%s
                    AND km_from <= %s
                    AND km_to >= %s
                    AND weight_from <= %s
                    AND weight_to >= %s
                    LIMIT 1
                """, ( partner_id, kms, kms, weight, weight ))

                row = cur.fetchone()

                return (row["oda_charge"] if row else 0 )
    
    # Add this inside the PostgresRepository class in repository.py
    def get_full_partner_profile(self, partner_id: int):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # 1. Fetch Parent
                cur.execute("SELECT * FROM logistics_partners WHERE id=%s", (partner_id,))
                partner = cur.fetchone()
                if not partner:
                    return None

                # 2. Fetch Zones (Convert array to comma-separated string for the UI)
                cur.execute("""
                    SELECT id, zone_code, zone_name, array_to_string(states, ', ') as states_raw 
                    FROM logistics_zones WHERE partner_id=%s
                """, (partner_id,))
                zones = cur.fetchall()

                # 3. Fetch Matrices
                cur.execute("SELECT id, destination_zone, rate_per_kg FROM logistics_zone_rates WHERE partner_id=%s", (partner_id,))
                rates = cur.fetchall()

                cur.execute("SELECT id, fuel_price_from, fuel_price_to, surcharge_percentage FROM logistics_fuel_matrix WHERE partner_id=%s", (partner_id,))
                fuel = cur.fetchall()

                cur.execute("SELECT id, km_from, km_to, weight_from, weight_to, oda_charge FROM logistics_oda_matrix WHERE partner_id=%s", (partner_id,))
                oda = cur.fetchall()

                # 4. Format Numeric Types for JSON Serialization
                partner['cft_factor'] = float(partner.get('cft_factor') or 10.0)
                partner['minimum_weight'] = float(partner.get('minimum_weight') or 0.0)
                partner['minimum_freight_value'] = float(partner.get('minimum_freight_value') or 0.0)
                partner['documentation_charge'] = float(partner.get('documentation_charge') or 0.0)
                partner['fov_percentage'] = float(partner.get('fov_percentage') or 0.0)
                partner['gst_percentage'] = float(partner.get('gst_percentage') or 18.0)

                for r in rates: r['rate_per_kg'] = float(r['rate_per_kg'])
                for f in fuel:
                    f['fuel_price_from'] = float(f['fuel_price_from'])
                    f['fuel_price_to'] = float(f['fuel_price_to'])
                    f['surcharge_percentage'] = float(f['surcharge_percentage'])
                for o in oda:
                    o['km_from'] = float(o['km_from'])
                    o['km_to'] = float(o['km_to'])
                    o['weight_from'] = float(o['weight_from'])
                    o['weight_to'] = float(o['weight_to'])
                    o['oda_charge'] = float(o['oda_charge'])

                return {
                    **partner,
                    "zones": zones,
                    "rates": rates,
                    "fuel_matrix": fuel,
                    "oda_matrix": oda
                }
    def get_partner_zones(self, partner_id):
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT zone_code, zone_name, states
                    FROM logistics_zones
                    WHERE partner_id=%s
                """, (partner_id,))

                rows = cur.fetchall()

                # NORMALIZE OUTPUT
                zones = []
                state_map = {}

                for r in rows:
                    zone_code = r["zone_code"]

                    zones.append({
                        "zone_code": zone_code,
                        "zone_name": r["zone_name"],
                        "states": r["states"] or []
                    })

                    for s in (r["states"] or []):
                        state_map[s] = zone_code

                return {
                    "zones": zones,
                    "state_map": state_map
                }
    # --- LOGISTICS PARTNER end---
    # --- ITEM MASTERY start---
    def get_item(self, item_code):

        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT *
                    FROM items_master
                    WHERE is_active = TRUE
                    ORDER BY item_code ASC
                """, (item_code,))
                item = cur.fetchone()
                if not item:
                    raise Exception("Item not found")
                item['rate'] = float(item['rate'])
                item['has_transactions'] = self.item_has_transactions(
                    item_code
                )

                return item
            
    def create_item(self, item_data: dict):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO items_master (item_code, item_name, item_group, rate, unit_measure, additional_spec_text, hsn_code, revision_no)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
                """, (
                    item_data['item_code'].strip(), 
                    item_data['item_name'].strip(), 
                    item_data['item_group'].strip(), 
                    item_data['rate'], 
                    item_data['unit_measure'].strip(),
                    item_data['additional_spec_text'].strip(),
                    item_data['hsn_code'].strip(),
                    item_data['revision_no'].strip()
                ))
                conn.commit()
                res = cur.fetchone()
                res['rate'] = float(res['rate'])
                return res
    
    def update_item(self, item_code, data):

        used = self.item_has_transactions(item_code)
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                if used:
                    cur.execute("""
                        UPDATE items_master
                        SET
                            rate=%s,
                            additional_spec_text=%s,
                            revision_no=%s
                        WHERE item_code=%s
                        RETURNING *
                    """, (
                        data.get("rate"),
                        data.get("additional_spec_text"),
                        data.get("revision_no"),
                        item_code
                    ))
                else:
                    cur.execute("""
                        UPDATE items_master
                        SET
                            item_name=%s,
                            item_group=%s,
                            rate=%s,
                            unit_measure=%s,
                            hsn_code=%s,
                            additional_spec_text=%s,
                            revision_no=%s
                        WHERE item_code=%s
                        RETURNING *
                    """, (
                        data.get("item_name"),
                        data.get("item_group"),
                        data.get("rate"),
                        data.get("unit_measure"),
                        data.get("hsn_code"),
                        data.get("additional_spec_text"),
                        data.get("revision_no"),
                        item_code
                    ))

                conn.commit()
                item = cur.fetchone()
                item["rate"] = float(item["rate"])

                return item
        
    def disable_item(self, item_code):

        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    UPDATE items_master
                    SET is_active = FALSE
                    WHERE item_code=%s
                    RETURNING item_code
                """, (item_code,))

                conn.commit()

                return {
                    "success": True
                }    
    
    def item_has_transactions(self, item_code):

        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS(
                        SELECT 1
                        FROM order_items
                        WHERE item_code=%s
                    )
                """, (item_code,))

            return cur.fetchone()['exists']
    # --- ITEM MASTERY end---
    
    # --- CONTEXTUAL ACCOUNTABILITY HUB (ACTIVITY LOGS) start---
    def get_activity_logs(self, entity_type: str, entity_id: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                
                cur.execute("""
                            SELECT a.*, u.name as operator_name
                            FROM activity_logs a
                            LEFT JOIN users u ON a.operator_email = u.email
                            WHERE a.entity_type = %s AND a.entity_id = %s
                            ORDER BY a.created_at ASC
                            """, (entity_type, str(entity_id)))
                logs = cur.fetchall()
            
                for log in logs:
                    log['created_at'] = log['created_at'].isoformat() if log['created_at'] else None
                return logs

    def create_activity_log(self, entity_type: str, entity_id: str, operator_email: str, log_type: str, message: str, metadata: dict = None):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                meta_json = json.dumps(metadata) if metadata else None
                cur.execute("""
                        INSERT INTO activity_logs(entity_type, entity_id, opeartor_email, log_type, message, metadata)
                        VALUES(%s, %s, %s, %s, %s, %s)
                        RETURNING log_id, created_at
                    """, (entity_type, str(entity_id), operator_email, log_type, message, meta_json))
                
                inserted = cur.fetchone()
                conn.commit()

                return {
                    "log_id": inserted['log_id'],
                    "entity_type": entity_type,
                    "entity_id": str(entity_id),
                    "operator_email": operator_email,
                    "log_type": log_type,
                    "message": message,
                    "metadata": metadata,
                    "created_at": inserted['created_at'].isoformat()
                }
    
    def get_dashboard_activity_tree(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        order_acceptance_id,
                        billing_name,
                        due_date,
                        CASE
                            WHEN due_date < CURRENT_DATE THEN 'past'
                            WHEN order_acceptance_date > CURRENT_DATE THEN 'future'
                            ELSE 'ongoing'
                        END AS status_category
                    FROM order_headers
                    ORDER BY due_date ASC
                """)
                orders = cur.fetchall()

                cur.execute("""
                            SELECT a.*, u.name as operator_name 
                    FROM activity_logs a
                    LEFT JOIN users u ON a.operator_email = u.email
                    WHERE a.entity_type = 'ORDER'
                    ORDER BY a.created_at DESC
                            """)
                logs = cur.fetchall()

                dashboard_tree = {"past": [], "ongoing": [], "future": []}

                logs_by_order = {}
                for log in logs:
                    eid = log['entity_id']
                    if eid not in logs_by_order:
                        logs_by_order[eid] = []
                    log['created_at'] = log['created_at'].isoformat()
                    logs_by_order[eid].append(log)

                for order in orders:
                    oid = str(order['order_acceptance_id'])
                    order['order_acceptance_id'] = oid
                    order['due_date'] = str(order(['due_date']))
                    order['logs'] = logs_by_order.get(oid, [])

                    cat = order.pop('status_category')
                    dashboard_tree[cat].append(order)

                return dashboard_tree
    # --- CONTEXTUAL ACCOUNTABILITY HUB (ACTIVITY LOGS) end---
    # --- CRM SUBSYSTEM start ---
    def get_crm_leads(self, user_profile: dict):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Admins see everything, Sales Reps only see leads assigned to their email
                if user_profile['role'] in ['Admin', 'Chief Full Stack Developer']:
                    cur.execute("SELECT * FROM crm_leads ORDER BY created_at DESC")
                else:
                    cur.execute("SELECT * FROM crm_leads WHERE assigned_to = %s ORDER BY created_at DESC", (user_profile['email'],))
                
                leads = cur.fetchall()
                for l in leads:
                    l['created_at'] = l['created_at'].isoformat() if l['created_at'] else None
                return leads

    def update_crm_lead_status(self, lead_id: int, status: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE crm_leads SET status = %s WHERE id = %s RETURNING id", (status, lead_id))
                conn.commit()
                return cur.fetchone()

    def create_crm_lead(self, lead_data: dict):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO crm_leads (
                        full_name, designation, company_name, contact_email,
                        phone_number, city_state, product_query, gdpr_consent,
                        assigned_region, assigned_to
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (
                    lead_data['full_name'], lead_data.get('designation'), lead_data.get('company_name'),
                    lead_data['contact_email'], lead_data.get('phone_number'), lead_data['city_state'],
                    lead_data.get('product_query'), lead_data.get('gdpr_consent', False),
                    lead_data.get('assigned_region'), lead_data.get('assigned_to')
                ))
                conn.commit()
                return cur.fetchone()['id']

    def get_sales_regions(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # UNNEST flattens the arrays into individual rows, DISTINCT removes duplicates
                cur.execute("""
                    SELECT DISTINCT unnest(regions) AS region_name 
                    FROM users 
                    WHERE regions IS NOT NULL AND array_length(regions, 1) > 0
                """)
                rows = cur.fetchall()
                
                # Format into the dictionary structure expected by classify_city_zone
                return [{"zone_code": r["region_name"], "zone_name": r["region_name"]} for r in rows]
    # --- CRM SUBSYSTEM end ---
    # --- GRN SUBSYSTEM start ---
    def create_grn(self, grn_data: dict, operator_email: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    INSERT INTO grn_headers
                    (
                        grn_number,
                        vendor_name,
                        operator_email
                    )
                    VALUES (%s,%s,%s)
                    RETURNING id, grn_number
                """, (
                    grn_data["grn_number"],
                    grn_data["vendor_name"],
                    operator_email
                ))

                header = cur.fetchone()
                grn_id = header["id"]

                for item in grn_data["items"]:

                    cur.execute("""
                        INSERT INTO grn_items
                        (
                            grn_id,
                            item_code,
                            quantity,
                            rate
                        )
                        VALUES (%s,%s,%s,%s)
                    """, (
                        grn_id,
                        item["item_code"],
                        item["quantity"],
                        item["rate"]
                    ))

                conn.commit()

                return {
                    "grn_id": grn_id,
                    "grn_number": header["grn_number"]
                }
    def get_grn_by_id(self, grn_id: int):

        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT *
                    FROM grn_headers
                    WHERE id=%s
                """, (grn_id,))

                header = cur.fetchone()

                if not header:
                    return None

                cur.execute("""
                    SELECT *
                    FROM grn_items
                    WHERE grn_id=%s
                    ORDER BY id
                """, (grn_id,))

                items = cur.fetchall()

                for item in items:
                    item["quantity"] = float(item["quantity"])
                    item["rate"] = float(item["rate"])
                    item["amount"] = float(item["amount"])

                subtotal = sum(i["amount"] for i in items)

                return {
                    "id": header["id"],
                    "grn_number": header["grn_number"],
                    "vendor_name": header["vendor_name"],
                    "invoice_date": str(header["receipt_date"]),
                    "items": items,
                    "subtotal": subtotal
                }
    #Testing
    def seed_test_items(self, items_list: list):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # We use ON CONFLICT DO NOTHING so you can safely run the CSV upload 
                # multiple times without throwing duplicate key errors.
                cur.executemany("""
                    INSERT INTO test_items_master (item_code, item_specification)
                    VALUES (%s, %s)
                    ON CONFLICT (item_code) DO NOTHING
                """, [(item['item_code'], item['item_specification']) for item in items_list])
                conn.commit()
    
    def get_test_items(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT
                        item_code,
                        item_specification
                    FROM test_items_master
                """)

                return cur.fetchall()
    
    def get_test_item_by_code(self, item_code: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT
                        item_code,
                        item_specification
                    FROM test_items_master
                    WHERE item_code=%s
                """, (item_code,))
                row = cur.fetchone()
                print(row)
                if not row:
                    return None
                
                return dict(row)
            
EDBR = PostgresRepository()