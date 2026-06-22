from database.repository import EDBR
import logging
from services.ai_region_classifier import classify_city_zone

def execute_dispatch_algorithm(shipment: dict, partner: dict) -> dict:
    calculation_state = {
        "partner_name": partner.get("name", "Unknown Partner"),
        "status": "pending",
        "data": None
    }
    debug = {}

    try:
        partner_id = partner["id"]

        # Step 1: Zone Identification
        source_state = 'W1'
        destination_city = shipment["destination_city"]

        source_zone = "W1"
        partner_zones = EDBR.get_partner_zones(partner_id)

        destination_zone = classify_city_zone(destination_city,partner_zones)

        debug["destination_city"] = destination_city
        debug["destination_zone"] = destination_zone
        debug["partner_zone_options"] = partner_zones

        if not destination_zone:
            raise ValueError(f"Zone not resolved for city: {destination_city}")

        # Step 2: Rate Extraction
        rate = EDBR.get_zone_rate(partner_id, destination_zone)
        if not rate:
            raise ValueError(f"No freight matrix found for {destination_zone}")

        # Step 3: Volumetric Mathematics
        width = float(shipment["width"])
        height = float(shipment["height"])
        depth = float(shipment["depth"])
        gross_weight = float(shipment["weight"])

        cubic_feet = (width * height * depth) / 1728
        volumetric_weight = (cubic_feet * float(partner["cft_factor"]))

        # Step 4: Chargeable Weight Logic
        chargeable_weight = max(gross_weight, volumetric_weight, float(partner["minimum_weight"]))
        basic_freight = (chargeable_weight * float(rate))
        basic_freight = max(basic_freight, float(partner["minimum_freight_value"]))

        # Step 5: Surcharges and ODA
        fuel_percentage = float(EDBR.get_fuel_surcharge(partner_id, shipment.get("diesel_price", 90.0)) or 0)
        fuel_charge = (basic_freight * fuel_percentage / 100)
        

        fov_charge = (float(shipment["invoice_value"]) * float(partner["fov_percentage"]) / 100)
        oda_charge = float(EDBR.get_oda_charge(partner_id, shipment.get("delivery_distance", 0), chargeable_weight) or 0)
        
        hamali_cost = float(shipment.get("hamali_cost", 0))
        hamali_detail = shipment.get("hamali_detail", "")

        subtotal = (basic_freight + fuel_charge + fov_charge + oda_charge + float(partner["documentation_charge"]) + hamali_cost)

        total = subtotal * (1 + float(partner["gst_percentage"]) / 100)

        # Build success payload
        calculation_state["status"] = "success"
        calculation_state["data"] = {
            "partner_id": partner_id,
            "partner_name": partner["name"],
            "destination_zone": destination_zone,
            "chargeable_weight": round(chargeable_weight, 2),
            "basic_freight": round(basic_freight, 2),
            "fuel_charge": round(fuel_charge, 2),
            "documentation_charge": round(partner["documentation_charge"], 2),
            "fov_charge": round(fov_charge, 2),
            "oda_charge": round(oda_charge, 2),
            "hamali_detail": hamali_detail,
            "hamali_cost": round(hamali_cost, 2),
            "subtotal": round(subtotal, 2),
            "dispatch_cost_gst": round(total, 2)
        }

    except KeyError as ke:
        # Catches missing payload requirements before calculating
        calculation_state["status"] = "error"
        calculation_state["error"] = f"Missing mandatory field: {str(ke)}"
        
    except Exception as e:
        # Catches division by zero, float casting errors, or DB disconnects
        calculation_state["status"] = "error"
        calculation_state["error"] = f"Evaluation failure: {str(e)}"
        
    finally:
        # The finally block ALWAYS executes. 
        # This guarantees the frontend receives a predictable dictionary structure, preventing false UI renders.
        if calculation_state["status"] == "error":
            logging.warning(f"Dispatch logic failed for {calculation_state['partner_name']} - {calculation_state.get('error')}")
            
        return calculation_state
    
def process_dispatch_calculation(payload: dict) -> dict:
    partners = EDBR.get_logistics_partners()

    results = []
    debug_trace = {
        "input_payload": payload,
        "partner_debug": []
    }

    gross_weight = float(payload['weight_kg'])
    length = float(payload['dimensions_l_in'])
    width = float(payload['dimensions_w_in'])
    height = float(payload['dimensions_h_in'])
    invoice_val = float(payload['invoice_value'])
    hamali_cost = float(payload.get('hamali_charges', 0.0))
    diesel_price = float(payload.get('diesel_price', 90.0))

    partner_distances = payload.get('partner_distances', {})
    pre_identified_zones = payload.get('pre_identified_zones', {})

    for p in partners:
        partner_state = {
            "partner_id": p["id"],
            "partner_name": p.get("name"),
            "status": "pending",
            "debug": {}
        }

        try:
            p_id_str = str(p["id"])

            # -------------------------
            # STEP 1: ZONE
            # -------------------------
            zone_code = pre_identified_zones.get(p_id_str)

            partner_state["debug"]["zone_input"] = zone_code

            if not zone_code:
                raise ValueError("Zone not pre-identified")

            # -------------------------
            # STEP 2: RATE
            # -------------------------
            rate_per_kg = None
            for r in p.get("rates", []):
                if r["destination_zone"] == zone_code:
                    rate_per_kg = float(r["rate_per_kg"])
                    break

            partner_state["debug"]["rate_found"] = rate_per_kg

            if not rate_per_kg:
                raise ValueError(f"No rate for zone {zone_code}")

            # -------------------------
            # STEP 3: VOLUMETRIC
            # -------------------------
            cubic_feet = (length * width * height) / 1728
            volumetric_weight = cubic_feet * float(p.get("cft_factor", 10))

            partner_state["debug"]["cubic_feet"] = cubic_feet
            partner_state["debug"]["volumetric_weight"] = volumetric_weight

            # -------------------------
            # STEP 4: CHARGEABLE WEIGHT
            # -------------------------
            chargeable_weight = max(
                gross_weight,
                volumetric_weight,
                float(p.get("minimum_weight", 0))
            )

            basic_freight = chargeable_weight * rate_per_kg
            basic_freight = max(basic_freight, float(p.get("minimum_freight_value", 0)))

            partner_state["debug"]["chargeable_weight"] = chargeable_weight
            partner_state["debug"]["basic_freight"] = basic_freight

            # -------------------------
            # STEP 5: SURCHARGES
            # -------------------------
            fuel_percentage = 0.0
            for f in p.get("fuel_matrix", []):
                if float(f["fuel_price_from"]) <= diesel_price <= float(f["fuel_price_to"]):
                    fuel_percentage = float(f["surcharge_percentage"])
                    break

            fuel_charge = basic_freight * (fuel_percentage / 100)

            fov_charge = invoice_val * (float(p.get("fov_percentage", 0)) / 100)

            partner_state["debug"]["fuel_percentage"] = fuel_percentage
            partner_state["debug"]["fuel_charge"] = fuel_charge
            partner_state["debug"]["fov_charge"] = fov_charge

            # -------------------------
            # STEP 6: ODA
            # -------------------------
            distance = float(partner_distances.get(p_id_str, 0))

            oda_charge = EDBR.get_oda_charge(
                p_id_str,
                distance,
                chargeable_weight
            ) or 0.0

            oda_charge = float(oda_charge)

            partner_state["debug"]["distance"] = distance
            partner_state["debug"]["oda_charge"] = oda_charge

            # -------------------------
            # STEP 7: FINAL
            # -------------------------
            doc_charge = float(p.get("documentation_charge", 0))

            subtotal = (
                basic_freight +
                fuel_charge +
                fov_charge +
                oda_charge +
                doc_charge +
                hamali_cost
            )

            gst = subtotal * (float(p.get("gst_percentage", 18)) / 100)
            total = subtotal + gst

            result = {
                "partner_id": p["id"],
                "partner_name": p["name"],
                "zone_code": zone_code,
                "chargeable_weight": round(chargeable_weight, 2),
                "breakdown": {
                    "freight": round(basic_freight, 2),
                    "fuel": round(fuel_charge, 2),
                    "oda": round(oda_charge, 2),
                    "doc": round(doc_charge, 2),
                    "fov": round(fov_charge, 2),
                    "hamali": round(hamali_cost, 2),
                    "gst": round(gst, 2)
                },
                "subtotal": round(subtotal, 2),
                "dispatch_cost_gst": round(total, 2)
            }

            partner_state["status"] = "success"
            partner_state["result"] = result

            results.append(result)

        except Exception as e:
            partner_state["status"] = "error"
            partner_state["error"] = str(e)

        finally:
            debug_trace["partner_debug"].append(partner_state)

    results.sort(key=lambda x: x["dispatch_cost_gst"])

    return {
        "options": results,
        "debug": debug_trace   # 👈 FULL TRACE FOR YOU
    }