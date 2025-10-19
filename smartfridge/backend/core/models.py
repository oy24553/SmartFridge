from django.db import models


# 占位模型，后续实现库存与事件
class Placeholder(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False

