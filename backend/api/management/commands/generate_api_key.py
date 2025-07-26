from django.core.management.base import BaseCommand
from api.models import APIKey


class Command(BaseCommand):
    help = 'Создает новый API-ключ для клиента'

    def add_arguments(self, parser):
        parser.add_argument('name', type=str, help='Название клиента')

    def handle(self, *args, **options):
        name = options['name']

        api_key = APIKey.objects.create(name=name)

        self.stdout.write(self.style.SUCCESS('API ключ создан учпешно:'))
        self.stdout.write(f"Название: {name}")
        self.stdout.write(f"Ключ: {api_key}")
        self.stdout.write(self.style.WARNING('Сохраните этот ключ, он больше не будет показан!'))




