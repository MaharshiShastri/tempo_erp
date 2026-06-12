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
        print("list of zones: ", partner_zones)
        destination_zone = classify_city_zone(destination_city,partner_zones)
        print(destination_zone)
        debug["destination_city"] = destination_city
        debug["destination_zone"] = destination_zone
        debug["partner_zone_options"] = partner_zones

        if not source_zone or not destination_zone:
            raise ValueError(f"Zone not resolved for city: {destination_city}")
        print("PARTNER ZONES=", partner_zones)
        # Step 2: Rate Extraction
        rate = EDBR.get_zone_rate(partner_id, source_zone, destination_zone)
        if not rate:
            raise ValueError(f"No freight matrix found for {source_zone} -> {destination_zone}")

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

        subtotal = (basic_freight + fuel_charge + fov_charge + oda_charge + 
                    float(partner["documentation_charge"]) + float(partner["hawala_charges"]))

        total = subtotal * (1 + float(partner["gst_percentage"]) / 100)

        # Build success payload
        calculation_state["status"] = "success"
        calculation_state["data"] = {
            "partner_id": partner_id,
            "partner_name": partner["name"],
            "source_zone": source_zone,
            "destination_zone": destination_zone,
            "chargeable_weight": round(chargeable_weight, 2),
            "basic_freight": round(basic_freight, 2),
            "fuel_charge": round(fuel_charge, 2),
            "fov_charge": round(fov_charge, 2),
            "oda_charge": round(oda_charge, 2),
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