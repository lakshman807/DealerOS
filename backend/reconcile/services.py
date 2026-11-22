from collections import defaultdict
from decimal import Decimal

import re

from reconcile.models import SystemRecord, SystemEntry


# --------------------------------------------------
# STEP 1: Normalize Record References
# --------------------------------------------------

def normalize_record_ref(value):

    if not value:
        return ""

    return re.sub(
        r"[^A-Z0-9]",
        "",
        value.strip().upper()
    )


# --------------------------------------------------
# STEP 2: Convert Decimal Safely
# --------------------------------------------------

def to_decimal(value):

    if value is None:
        return None

    return Decimal(str(value))


# --------------------------------------------------
# STEP 3: Prepare System B Details
# --------------------------------------------------

def prepare_system_b_details(entries):

    details = []

    for entry in entries:

        details.append({

            "entry_id": entry.entry_id,

            "record_ref": entry.record_ref,

            "amount": str(entry.value) if entry.value is not None else None,

            "date": str(entry.recorded_on) if entry.recorded_on else None,

            "location": entry.location_id,

            "label": entry.label

        })

    return details


# --------------------------------------------------
# STEP 4: Check Whether Entries Are Exact Duplicates
# --------------------------------------------------

def are_exact_duplicates(entries):

    signatures = []

    for entry in entries:

        signature = (
            entry.value,
            entry.recorded_on,
            entry.location_id,
            entry.label
        )

        signatures.append(signature)

    return len(signatures) != len(set(signatures))


# --------------------------------------------------
# STEP 5: Reconciliation Main Function
# --------------------------------------------------

def reconcile_records(org_id):

    # Fetch System A records
    system_a_records = list(
        SystemRecord.objects.filter(
            location__org_id=org_id
        ).select_related("location")
    )

    # Fetch System B entries
    system_b_entries = list(
        SystemEntry.objects.filter(
            location__org_id=org_id
        ).select_related("location")
    )

    # Group System B entries
    system_b_map = defaultdict(list)

    for entry in system_b_entries:

        normalized_ref = normalize_record_ref(
            entry.record_ref
        )

        if normalized_ref:
            system_b_map[normalized_ref].append(entry)

    results = []

    # Summary counters
    matched_count = 0
    mismatch_count = 0
    missing_in_a_count = 0
    missing_in_b_count = 0
    duplicate_count = 0
    split_matched_count = 0
    multiple_entry_mismatch_count = 0

    # --------------------------------------------------
    # STEP 6: Compare System A with System B
    # --------------------------------------------------

    for record in system_a_records:

        record_id = record.record_id

        normalized_id = normalize_record_ref(record_id)

        matching_entries = system_b_map.pop(
            normalized_id,
            []
        )

        system_a_amount = to_decimal(record.total_value)

        # System A details
        system_a_details = {

            "record_id": record.record_id,

            "amount": str(record.total_value) if record.total_value is not None else None,

            "date": str(record.event_date) if record.event_date else None,

            "location": record.location_id,

            "category_code": record.category_code,

            "actor_id": record.actor_id,

            "base_value": str(record.base_value) if record.base_value is not None else None,

            "adjustment": str(record.adjustment) if record.adjustment is not None else None,

            "state": record.state

        }

        # --------------------------------------------------
        # CASE 1: Missing in System B
        # --------------------------------------------------

        if not matching_entries:

            results.append({

                "record_id": record_id,

                "status": "MISSING_IN_SYSTEM_B",

                "system_a_amount": str(record.total_value) if record.total_value is not None else None,

                "system_b_amount": None,

                "system_a_date": str(record.event_date) if record.event_date else None,

                "system_b_date": None,

                "system_a_location": record.location_id,

                "system_b_location": None,

                "system_a": system_a_details,

                "system_b": None,

                "differences": [
                    "Record not found in System B"
                ]

            })

            missing_in_b_count += 1

            continue

        # --------------------------------------------------
        # CASE 2: Multiple System B Entries
        # --------------------------------------------------

        if len(matching_entries) > 1:

            system_b_details = prepare_system_b_details(
                matching_entries
            )

            entry_ids = [
                entry.entry_id for entry in matching_entries
            ]

            # Calculate combined System B amount
            amounts = [
                to_decimal(entry.value)
                for entry in matching_entries
            ]

            combined_amount = None

            if all(amount is not None for amount in amounts):

                combined_amount = sum(
                    amounts,
                    Decimal("0")
                )

            # Check exact duplicate entries
            exact_duplicates = are_exact_duplicates(
                matching_entries
            )

            differences = [
                "Multiple System B entries reference this record"
            ]

            # Compare combined amount
            amount_matches = (
                system_a_amount is not None
                and combined_amount is not None
                and system_a_amount == combined_amount
            )

            # Check dates
            date_mismatch = any(
                entry.recorded_on != record.event_date
                for entry in matching_entries
            )

            # Check locations
            location_mismatch = any(
                entry.location_id != record.location_id
                for entry in matching_entries
            )

            if date_mismatch:
                differences.append("DATE_MISMATCH")

            if location_mismatch:
                differences.append("LOCATION_MISMATCH")

            # ----------------------------------------------
            # Determine Multiple Entry Status
            # ----------------------------------------------

            if exact_duplicates:

                status = "DUPLICATE_IN_SYSTEM_B"

                duplicate_count += 1

                if not amount_matches:
                    differences.append("AMOUNT_MISMATCH")

            elif amount_matches and not date_mismatch and not location_mismatch:

                status = "SPLIT_MATCHED"

                split_matched_count += 1

                differences = []

            else:

                status = "MULTIPLE_ENTRIES_AMOUNT_MISMATCH"

                multiple_entry_mismatch_count += 1

                if not amount_matches:
                    differences.append("AMOUNT_MISMATCH")

            # Append result
            results.append({

                "record_id": record_id,

                "status": status,

                "system_a_amount": str(system_a_amount) if system_a_amount is not None else None,

                "system_b_amount": str(combined_amount) if combined_amount is not None else None,

                "system_b_combined_amount": str(combined_amount) if combined_amount is not None else None,

                "system_a_date": str(record.event_date) if record.event_date else None,

                "system_b_date": str(matching_entries[0].recorded_on) if matching_entries[0].recorded_on else None,

                "system_a_location": record.location_id,

                "system_b_location": matching_entries[0].location_id,

                "system_a": system_a_details,

                "system_b": system_b_details,

                "system_b_entry_ids": entry_ids,

                "system_b_entry_count": len(matching_entries),

                "amount_difference": (
                    str(system_a_amount - combined_amount)
                    if system_a_amount is not None and combined_amount is not None
                    else None
                ),

                "exact_duplicates": exact_duplicates,

                "differences": differences

            })

            continue

        # --------------------------------------------------
        # CASE 3: Single Matching System B Entry
        # --------------------------------------------------

        entry = matching_entries[0]

        differences = []

        system_b_amount = to_decimal(entry.value)

        if system_a_amount != system_b_amount:
            differences.append("AMOUNT_MISMATCH")

        if record.event_date != entry.recorded_on:
            differences.append("DATE_MISMATCH")

        if record.location_id != entry.location_id:
            differences.append("LOCATION_MISMATCH")

        system_b_details = prepare_system_b_details(
            matching_entries
        )[0]

        if not differences:

            status = "MATCHED"

            matched_count += 1

        else:

            status = "MISMATCH"

            mismatch_count += 1

        results.append({

            "record_id": record_id,

            "system_b_entry_id": entry.entry_id,

            "status": status,

            "system_a_amount": str(record.total_value) if record.total_value is not None else None,

            "system_b_amount": str(entry.value) if entry.value is not None else None,

            "system_a_date": str(record.event_date) if record.event_date else None,

            "system_b_date": str(entry.recorded_on) if entry.recorded_on else None,

            "system_a_location": record.location_id,

            "system_b_location": entry.location_id,

            "system_a": system_a_details,

            "system_b": system_b_details,

            "differences": differences

        })

    # --------------------------------------------------
    # STEP 7: Records Existing Only in System B
    # --------------------------------------------------

    for entries in system_b_map.values():

        for entry in entries:

            results.append({

                "record_id": entry.record_ref,

                "system_b_entry_id": entry.entry_id,

                "status": "MISSING_IN_SYSTEM_A",

                "system_a_amount": None,

                "system_b_amount": str(entry.value) if entry.value is not None else None,

                "system_a_date": None,

                "system_b_date": str(entry.recorded_on) if entry.recorded_on else None,

                "system_a_location": None,

                "system_b_location": entry.location_id,

                "system_a": None,

                "system_b": prepare_system_b_details([entry])[0],

                "differences": [
                    "Record not found in System A"
                ]

            })

            missing_in_a_count += 1

    # --------------------------------------------------
    # STEP 8: Final Summary
    # --------------------------------------------------

    summary = {

        "organization": org_id,

        "total_system_a_records": len(system_a_records),

        "total_system_b_entries": len(system_b_entries),

        "matched": matched_count,

        "split_matched": split_matched_count,

        "mismatched": mismatch_count,

        "multiple_entry_mismatches": multiple_entry_mismatch_count,

        "missing_in_system_a": missing_in_a_count,

        "missing_in_system_b": missing_in_b_count,

        "duplicates_in_system_b": duplicate_count,

        "total_results": len(results)

    }

    # --------------------------------------------------
    # STEP 9: Return API Response
    # --------------------------------------------------

    return {

        "summary": summary,

        "results": results

    }