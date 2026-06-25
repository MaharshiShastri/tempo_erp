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
        destination_city = shipment["destination_city"]
        partner_zones_data = EDBR.get_partner_zones(partner_id)
        destination_zone = classify_city_zone(destination_city, partner_zones_data["zones"])

        debug["destination_city"] = destination_city
        debug["destination_zone"] = destination_zone
        debug["partner_zone_options"] = partner_zones_data

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

        cubic_feet = (width * height * depth) / 1728
        volumetric_weight = (cubic_feet * float(partner["cft_factor"]))

        # Step 4: Chargeable Weight Logic
        chargeable_weight = max(volumetric_weight, float(partner["minimum_weight"]))
        basic_freight = (chargeable_weight * float(rate))
        basic_freight = max(basic_freight, float(partner["minimum_freight_value"]))

        # Step 5: Surcharges and ODA
        fuel_percentage = float(EDBR.get_fuel_surcharge(partner_id, shipment.get("diesel_price", 90.0)) or 0)
        fuel_charge = (basic_freight * fuel_percentage / 100)
        print("fuel percentage: ", fuel_percentage, " and fuel charge is: ", fuel_charge)

        fov_charge = (float(shipment["invoice_value"]) * float(partner["fov_percentage"]) / 100)
        partner_distances = shipment.get("partner_distances", {})
        distance = float(partner_distances.get(str(partner["id"]), partner_distances.get(partner["id"], 0)))
        
        delivery_type = shipment.get("delivery_type", "door")
        distance = 0
        if delivery_type == "door":
            partner_distances = shipment.get("partner_distances", {})
            distance = float(partner_distances.get(str(partner["id"]), partner_distances.get(partner["id"], 0)))
        
        oda_charge = float(EDBR.get_oda_charge(partner_id, distance, chargeable_weight) or 0)
        
        loading_type = shipment.get("loading_type", "local")
        loading_charge = 0.0
        
        if loading_type == "local":
            loading_charge = float(partner.get("local_loading_cost", 100000000))
        elif loading_type == "hub":
            user_hub_input = float(shipment.get("hub_loading_input", 100000000000000000000))
            max_hub_cost = float(partner.get("hub_loading_max_cost", 10000000000000000000000000000))
            
            # If max cost is defined (>0), cap it. Otherwise, use user input raw.
            if max_hub_cost > 0:
                loading_charge = min(user_hub_input, max_hub_cost)
            else:
                loading_charge = user_hub_input


        hamali_cost = float(shipment.get("hamali_cost", 0))
        hamali_detail = shipment.get("hamali_detail", "")

        subtotal = (basic_freight + fuel_charge + fov_charge + oda_charge + loading_charge + float(partner["documentation_charge"]) + hamali_cost)

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
            "loading_charge": round(loading_charge, 2),
            "documentation_charge": round(partner["documentation_charge"], 2),
            "fov_charge": round(fov_charge, 2),
            "oda_charge": round(oda_charge, 2),
            "hamali_detail": hamali_detail,
            "hamali_cost": round(hamali_cost, 2),
            "subtotal": round(subtotal, 2),
            "dispatch_cost_gst": round(total, 2)
        }

    except KeyError as ke:
        calculation_state = {
            "partner_name": partner.get("name", "Unknown"),
            "status": "error",
            "data": None,
            "error": None
        }
        # Catches missing payload requirements before calculating
        print("Key error: ", ke)
        calculation_state["status"] = "error"
        calculation_state["error"] = f"Missing mandatory field: {str(ke)}"

    except Exception as e:
        # Catches division by zero, float casting errors, or DB disconnects
        print("Other exceptions:", str(e))
        calculation_state = {
            "partner_name": partner.get("name", "Unknown"),
            "status": "error",
            "data": None,
            "error": None
        }
        calculation_state["status"] = "error"
        calculation_state["error"] = f"Evaluation failure: {str(e)}"

    finally:
        # The finally block ALWAYS executes. 
        # This guarantees the frontend receives a predictable dictionary structure, preventing false UI renders.
        if calculation_state["status"] == "error":
            logging.warning(f"Dispatch logic failed for {calculation_state['partner_name']} - {calculation_state.get('error')}")

    return calculation_state