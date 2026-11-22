import csv

from pathlib import Path
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from reconcile.models import Location, SystemRecord, SystemEntry


class Command(BaseCommand):

    help = "Import CSV files into DealerOS database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--data-dir",
            type=Path,
            default=None,
            help="Directory containing CSV files"
        )

    def handle(self, *args, **options):

        data_dir = options["data_dir"] or (
            Path(settings.BASE_DIR) / "data"
        )

        locations_file = data_dir / "locations.csv"
        system_a_file = data_dir / "system_a.csv"
        system_b_file = data_dir / "system_b.csv"

        files = [
            locations_file,
            system_a_file,
            system_b_file
        ]

        for file in files:
            if not file.exists():
                raise CommandError(
                    f"CSV file not found: {file}"
                )

        self.stdout.write(
            self.style.SUCCESS("Starting CSV import...")
        )

        # Step 1: Import Locations
        self.import_locations(locations_file)

        # Step 2: Import System A
        self.import_system_a(system_a_file)

        # Step 3: Import System B
        self.import_system_b(system_b_file)

        self.stdout.write(
            self.style.SUCCESS(
                "\nAll CSV imports completed successfully!"
            )
        )

    def read_csv(self, file_path):

        with open(
            file_path,
            mode="r",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            reader = csv.DictReader(file)

            for row in reader:
                yield row

    def import_locations(self, file_path):

        self.stdout.write("\nImporting Locations...")

        created_count = 0
        updated_count = 0
        error_count = 0

        for row_number, row in enumerate(
            self.read_csv(file_path), start=2
        ):

            try:

                location_id = row["location_id"].strip()
                org_id = row["org_id"].strip()
                name = row["location_name"].strip()

                if not location_id or not org_id:
                    raise ValueError("Missing required location data")

                _, created = Location.objects.update_or_create(
                    location_id=location_id,
                    defaults={
                        "org_id": org_id,
                        "name": name or None
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as error:

                error_count += 1

                self.stderr.write(
                    f"Location row {row_number}: {error}"
                )

        self.print_summary(
            "Locations",
            created_count,
            updated_count,
            error_count
        )

    def import_system_a(self, file_path):

        self.stdout.write("\nImporting System A records...")

        created_count = 0
        updated_count = 0
        error_count = 0

        for row_number, row in enumerate(
            self.read_csv(file_path), start=2
        ):

            try:

                location = Location.objects.get(
                    location_id=row["location_id"].strip()
                )

                record_id = row["record_id"].strip()

                if not record_id:
                    raise ValueError("Missing record_id")

                _, created = SystemRecord.objects.update_or_create(

                    record_id=record_id,

                    defaults={

                        "location": location,

                        "event_date": self.parse_date(
                            row.get("event_date")
                        ),

                        "category_code": row.get("category_code"),

                        "actor_id": row.get("actor_id"),

                        "base_value": self.parse_decimal(
                            row.get("base_value")
                        ),

                        "adjustment": self.parse_decimal(
                            row.get("adjustment")
                        ),

                        "total_value": self.parse_decimal(
                            row.get("total_value")
                        ),

                        "state": row.get("state")
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as error:

                error_count += 1

                self.stderr.write(
                    f"System A row {row_number}: {error}"
                )

        self.print_summary(
            "System A",
            created_count,
            updated_count,
            error_count
        )

    def import_system_b(self, file_path):

        self.stdout.write("\nImporting System B entries...")

        created_count = 0
        updated_count = 0
        error_count = 0

        for row_number, row in enumerate(
            self.read_csv(file_path), start=2
        ):

            try:

                location = Location.objects.get(
                    location_id=row["location_id"].strip()
                )

                entry_id = row["entry_id"].strip()

                record_ref = row.get("record_ref", "").strip()

                if not entry_id:
                    raise ValueError("Missing entry_id")

                _, created = SystemEntry.objects.update_or_create(

                    entry_id=entry_id,

                    defaults={

                        "record_ref_raw": record_ref,

                        "record_ref": record_ref,

                        "location": location,

                        "recorded_on": self.parse_date(
                            row.get("recorded_on")
                        ),

                        "value_raw": row.get("value"),

                        "value": self.parse_decimal(
                            row.get("value")
                        ),

                        "label": row.get("label")
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as error:

                error_count += 1

                self.stderr.write(
                    f"System B row {row_number}: {error}"
                )

        self.print_summary(
            "System B",
            created_count,
            updated_count,
            error_count
        )

    @staticmethod
    def parse_date(value):

        if not value or not value.strip():
            return None

        return date.fromisoformat(value.strip())

    @staticmethod
    def parse_decimal(value):

        if value is None or not value.strip():
            return None

        cleaned_value = value.strip().replace(",", "")

        return Decimal(cleaned_value)

    def print_summary(
        self,
        name,
        created,
        updated,
        errors
    ):

        self.stdout.write(f"\n{name} Import Summary")

        self.stdout.write(f"Created : {created}")
        self.stdout.write(f"Updated : {updated}")
        self.stdout.write(f"Errors  : {errors}")