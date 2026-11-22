from django.core.management.base import BaseCommand


class Command(BaseCommand):

    help = "Import CSV data into database"

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(
                "CSV importer command is working!"
            )
        )