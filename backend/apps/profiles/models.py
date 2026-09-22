from django.db import models
from apps.websites.models import Website

class PortfolioProfile(models.Model):
    website = models.OneToOneField(Website, on_delete=models.CASCADE, related_name='profile', db_index=True)
    full_name = models.CharField(max_length=150, default="Roshan Damor")
    title = models.CharField(max_length=200, default="Software Engineer · Full Stack AI")
    email = models.EmailField(default="mail@logicbyroshan.in")
    phone = models.CharField(max_length=50, default="+91 90000 00000")
    location = models.CharField(max_length=150, default="Bhopal, Madhya Pradesh, India")
    bio = models.TextField(default="Software Engineer specializing in scalable full-stack web applications and AI workflows.")
    profile_image = models.TextField(default="/media/profile/hero.webp", blank=True)
    hero_image = models.TextField(default="/media/hero/custom_hero.webp", blank=True)
    hero_badge = models.CharField(max_length=100, default="Hello, I am")
    hero_description = models.TextField(default="I build production software and AI-powered applications, from backend systems and SaaS platforms to LLM-powered workflows and intelligent developer tools.")
    
    # Dynamic Highlights Configuration
    hero_highlights_title = models.CharField(max_length=150, default="Quick Portfolio Highlights", blank=True)
    hero_highlights_visible = models.BooleanField(default=True)
    hero_stats = models.JSONField(default=list, blank=True, help_text="List of stat highlights: [{'value': '1,000+', 'label': 'Production Users', 'icon': 'fas fa-users'}]")
    
    # Backward compatible fields
    hero_stat_1_value = models.CharField(max_length=50, default="1,000+", blank=True)
    hero_stat_1_label = models.CharField(max_length=100, default="Production Users", blank=True)
    hero_stat_1_icon = models.CharField(max_length=50, default="fas fa-users", blank=True)
    hero_stat_2_value = models.CharField(max_length=50, default="136K+", blank=True)
    hero_stat_2_label = models.CharField(max_length=100, default="ID Cards Processed", blank=True)
    hero_stat_2_icon = models.CharField(max_length=50, default="fas fa-id-card", blank=True)
    hero_stat_3_value = models.CharField(max_length=50, default="86K+", blank=True)
    hero_stat_3_label = models.CharField(max_length=100, default="Cards Downloaded", blank=True)
    hero_stat_3_icon = models.CharField(max_length=50, default="fas fa-cloud-download-alt", blank=True)
    
    github = models.URLField(max_length=300, default="https://github.com/logicbyroshan", blank=True)
    linkedin = models.URLField(max_length=300, default="https://linkedin.com/in/logicbyroshan", blank=True)
    twitter = models.CharField(max_length=150, default="https://twitter.com/logicbyroshan", blank=True)
    instagram = models.CharField(max_length=150, default="", blank=True)
    youtube = models.URLField(max_length=300, default="https://youtube.com/@logicbyroshan", blank=True)
    website_url = models.URLField(max_length=300, default="https://logicbyroshan.in", blank=True)
    resume = models.TextField(default="/media/documents/Roshan_Damor_Resume.pdf", blank=True, null=True)
    cover_letter = models.TextField(blank=True, null=True)
    video_resume = models.URLField(max_length=300, default="https://www.youtube.com/@logicbyroshan", blank=True, null=True)
    status = models.CharField(max_length=50, default="available")
    work_type = models.CharField(max_length=50, default="remote")
    hourly_rate = models.CharField(max_length=50, default="45.00")
    experience_years = models.CharField(max_length=50, default="3")
    open_to_opportunities = models.BooleanField(default=True)
    available_for_freelance = models.BooleanField(default=True)
    avatar = models.TextField(default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80", blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Sync hero_stats list and individual stat fields
        if self.hero_stats and isinstance(self.hero_stats, list):
            if len(self.hero_stats) > 0 and isinstance(self.hero_stats[0], dict):
                self.hero_stat_1_value = self.hero_stats[0].get('value', '')
                self.hero_stat_1_label = self.hero_stats[0].get('label', '')
                self.hero_stat_1_icon = self.hero_stats[0].get('icon', 'fas fa-chart-line')
            if len(self.hero_stats) > 1 and isinstance(self.hero_stats[1], dict):
                self.hero_stat_2_value = self.hero_stats[1].get('value', '')
                self.hero_stat_2_label = self.hero_stats[1].get('label', '')
                self.hero_stat_2_icon = self.hero_stats[1].get('icon', 'fas fa-chart-line')
            else:
                self.hero_stat_2_value = ''
            if len(self.hero_stats) > 2 and isinstance(self.hero_stats[2], dict):
                self.hero_stat_3_value = self.hero_stats[2].get('value', '')
                self.hero_stat_3_label = self.hero_stats[2].get('label', '')
                self.hero_stat_3_icon = self.hero_stats[2].get('icon', 'fas fa-chart-line')
            else:
                self.hero_stat_3_value = ''
        elif not self.hero_stats:
            stats = []
            if self.hero_stat_1_value:
                stats.append({'value': self.hero_stat_1_value, 'label': self.hero_stat_1_label, 'icon': self.hero_stat_1_icon or 'fas fa-users'})
            if self.hero_stat_2_value:
                stats.append({'value': self.hero_stat_2_value, 'label': self.hero_stat_2_label, 'icon': self.hero_stat_2_icon or 'fas fa-id-card'})
            if self.hero_stat_3_value:
                stats.append({'value': self.hero_stat_3_value, 'label': self.hero_stat_3_label, 'icon': self.hero_stat_3_icon or 'fas fa-cloud-download-alt'})
            self.hero_stats = stats

        super().save(*args, **kwargs)

    @property
    def name(self):
        return self.full_name

    @property
    def resume_url(self):
        return self.resume

    def __str__(self):
        return f"{self.full_name} - Profile ({self.website.name})"
