from django.db import models
from apis.models import UserStatus
import random

class Group(models.Model):
    user = models.ManyToManyField(UserStatus, related_name='member_groups')
    name = models.CharField(max_length=30)
    leader = models.ForeignKey(UserStatus, on_delete=models.DO_NOTHING, related_name='leading_groups')
    joining_code = models.CharField(max_length=4)

    def save(self, *args, **kwargs):
        if not self.joining_code:
            self.joining_code = "".join([random.randint(1, 9) for _ in range(4)])
        super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        if self.leader == self.user.first():  # Check if the leader is the one requesting deletion
            super().delete(using, keep_parents)
        else:
            raise PermissionError("Only the group leader can delete the group")
