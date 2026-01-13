from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_ROLES = (
        ('user', 'User'),
        ('admin', 'Admin'),
        ('provider', 'Travel Service Provider'),
    )
    
    role = models.CharField(max_length=20, choices=USER_ROLES, default='user')
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.URLField(blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    # Fix the clash by adding related_name
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='tourism_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='tourism_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    def __str__(self):
        return self.username