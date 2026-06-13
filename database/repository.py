import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
from schemas.logistics_schema import FullPartnerProfile
import logging
import os

DB_DSN = os.getenv("DATABASE_URL", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)
logger.info(f"DB URI: {DB_DSN}")
# We keep companies and items mock arrays temporarily as requested until Phase 2
MOCK_COMPANIES = [
    {"id": "C001", "name": "Tata Power", "address": "Bombay House, Fort, Mumbai"},
    {"id": "C002", "name": "Reliance Industries", "address": "Maker Chambers IV, Nariman Point, Mumbai"}
]

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
                        partner_name, source_zone, destination_zone, chargeable_weight, 
                        basic_freight, fuel_charge, fov_charge, oda_charge, 
                        hamali_detail, hamali_cost, subtotal, dispatch_cost_gst,
                        operator_email
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (
                    record.get("partner_name"), record.get("source_zone"), record.get("destination_zone"),
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
                    # 1. Update the parent partner record
                    cur.execute("""
                        UPDATE logistics_partners 
                        SET name=%s, cft_factor=%s, minimum_weight=%s, minimum_freight_value=%s, 
                            documentation_charge=%s, fov_percentage=%s, hawala_charges=%s, gst_percentage=%s
                        WHERE id=%s
                    """, (p['name'], p['cft_factor'], p['minimum_weight'], p['minimum_freight_value'], 
                            p['documentation_charge'], p['fov_percentage'], p['hawala_charges'], p['gst_percentage'], partner_id))

                    # 2. THE WIPE - Delete all existing child matrices for this partner
                    cur.execute("DELETE FROM logistics_zones WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_zone_rates WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_fuel_matrix WHERE partner_id=%s", (partner_id,))
                    cur.execute("DELETE FROM logistics_oda_matrix WHERE partner_id=%s", (partner_id,))

                    # 3. THE REPLACE - Re-insert the fresh matrices from the UI
                    for z in p['zones']:
                        cur.execute("INSERT INTO logistics_zones (partner_id, zone_code, zone_name, states) VALUES (%s, %s, %s, %s)",
                                    (partner_id, z['zone_code'], z['zone_name'], z['states']))
                    for r in p['rates']:
                        cur.execute("INSERT INTO logistics_zone_rates (partner_id, source_zone, destination_zone, rate_per_kg) VALUES (%s, %s, %s, %s)",
                                    (partner_id, r['source_zone'], r['destination_zone'], r['rate_per_kg']))
                    for f in p['fuel_matrix']:
                        cur.execute("INSERT INTO logistics_fuel_matrix (partner_id, fuel_price_from, fuel_price_to, surcharge_percentage) VALUES (%s, %s, %s, %s)",
                                    (partner_id, f['fuel_price_from'], f['fuel_price_to'], f['surcharge_percentage']))
                    for o in p['oda_matrix']:
                        cur.execute("INSERT INTO logistics_oda_matrix (partner_id, km_from, km_to, weight_from, weight_to, oda_charge) VALUES (%s, %s, %s, %s, %s, %s)",
                                    (partner_id, o['km_from'], o['km_to'], o['weight_from'], o['weight_to'], o['oda_charge']))

                    # 4. Commit the transaction ONLY if all inserts succeed
                    conn.commit()
                    return {"partner_id": partner_id, "status": "updated"}
                    
                except Exception as e:
                    # If ANY query fails, revert the database to its exact state before the update began
                    conn.rollback()
                    raise e
            
    def create_full_partner_profile(self, p: FullPartnerProfile):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    # 1. Create Partner
                    cur.execute("""
                        INSERT INTO logistics_partners (name, cft_factor, minimum_weight, minimum_freight_value, 
                                                        documentation_charge, fov_percentage, hawala_charges, gst_percentage)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                    """, (p.name, p.cft_factor, p.minimum_weight, p.minimum_freight_value, 
                          p.documentation_charge, p.fov_percentage, p.hawala_charges, p.gst_percentage))
                    
                    partner_id = cur.fetchone()['id']

                    # 2. Insert Zones
                    for z in p.zones:
                        cur.execute("INSERT INTO logistics_zones (partner_id, zone_code, zone_name, states) VALUES (%s, %s, %s, %s)",
                                    (partner_id, z.zone_code, z.zone_name, z.states))

                    # 3. Insert Rates
                    for r in p.rates:
                        cur.execute("INSERT INTO logistics_zone_rates (partner_id, source_zone, destination_zone, rate_per_kg) VALUES (%s, %s, %s, %s)",
                                    (partner_id, r.source_zone, r.destination_zone, r.rate_per_kg))

                    # 4. Insert Fuel
                    for f in p.fuel_matrix:
                        cur.execute("INSERT INTO logistics_fuel_matrix (partner_id, fuel_price_from, fuel_price_to, surcharge_percentage) VALUES (%s, %s, %s, %s)",
                                    (partner_id, f.fuel_price_from, f.fuel_price_to, f.surcharge_percentage))

                    # 5. Insert ODA
                    for o in p.oda_matrix:
                        cur.execute("INSERT INTO logistics_oda_matrix (partner_id, km_from, km_to, weight_from, weight_to, oda_charge) VALUES (%s, %s, %s, %s, %s, %s)",
                                    (partner_id, o.km_from, o.km_to, o.weight_from, o.weight_to, o.oda_charge))

                    conn.commit()
                    return {"partner_id": partner_id, "status": "success"}
                
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
        
    def get_zone_rate( self,  partner_id, source_zone,destination_zone):
        with self._get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT rate_per_kg
                    FROM logistics_zone_rates
                    WHERE partner_id=%s
                    AND source_zone=%s
                    AND destination_zone=%s
                    LIMIT 1
                """, (partner_id, source_zone, destination_zone ))

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
                    AND fuel_price_to > %s
                    LIMIT 1
                """, (partner_id, diesel_price, diesel_price ))

                row = cur.fetchone()

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
                cur.execute("SELECT id, source_zone, destination_zone, rate_per_kg FROM logistics_zone_rates WHERE partner_id=%s", (partner_id,))
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
                partner['hawala_charges'] = float(partner.get('hawala_charges') or 0.0)
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
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT
                        zone_code,
                        zone_name
                    FROM logistics_zones
                    WHERE partner_id=%s
                """, (partner_id,))

                return cur.fetchall()
    # --- LOGISTICS PARTNET end---
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
EDBR = PostgresRepository()