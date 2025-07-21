# from __future__ import absolute_import, unicode_literals
# import os
# from celery import Celery , shared_task
# from django.conf import settings


# # Set the default Django settings module for the 'celery' program.
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'desis_project.settings')

# app = Celery('desis_project')

# # Using a string here means the worker doesn't have to serialize
# # the configuration object to child processes.
# app.config_from_object('django.conf:settings', namespace='CELERY')

# # Load task modules from all registered Django app configs.
# app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)
# import os

# # @app.task(bind=True)
# # def debug_task(self):
# #     print("Running")
# #     file_name = "example.txt"
# #     with open(file_name, 'w') as file:
# #         file.write("Hello, this is a new file created in Python!")



# # @shared_task
# # def add(x, y):
# #     print("here")
# #     return x + y

# # result = add.delay(3, 5)


# # You can also manually specify the tasks modules to load like this:
# # app.autodiscover_tasks(['myapp1', 'myapp2'])

# # @app.task(bind=True)
# # def debug_task(self):
# #     print('Request: {0!r}'.format(self.request))

