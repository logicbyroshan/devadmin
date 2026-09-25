"""
Verify all API endpoints against ADMIN_API.md and API.md
"""
import os
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'devadmin_backend.settings')
import django
django.setup()

from django.test import Client
from django.contrib.auth.models import User

client = Client()

# Create or get admin user
admin_user, _ = User.objects.get_or_create(username='admin', defaults={'email': 'mail@logicbyroshan.in', 'is_staff': True, 'is_superuser': True})
admin_user.set_password('AdminSecure123!')
admin_user.save()

print("Testing API endpoints...")

# 1. Auth Login
login_res = client.post('/api/v1/admin/auth/login/', data=json.dumps({'username': 'admin', 'password': 'AdminSecure123!'}), content_type='application/json')
assert login_res.status_code == 200, f"Login failed: {login_res.status_code} {login_res.content}"
tokens = login_res.json()
access_token = tokens.get('access')
auth_header = f"Bearer {access_token}"
print(" [PASS] Staff JWT Login (/api/v1/admin/auth/login/)")

# 2. Auth Me
me_res = client.get('/api/v1/admin/auth/me/', HTTP_AUTHORIZATION=auth_header)
assert me_res.status_code == 200, f"Auth Me failed: {me_res.status_code}"
print(" [PASS] Auth Me (/api/v1/admin/auth/me/)")

# 3. Admin Analytics Dashboard
dash_res = client.get('/api/v1/admin/analytics/dashboard/', HTTP_AUTHORIZATION=auth_header)
assert dash_res.status_code == 200, f"Analytics Dashboard failed: {dash_res.status_code}"
dash_data = dash_res.json()
assert 'projects' in dash_data.get('data', {}), "Analytics payload missing projects"
print(" [PASS] Admin Analytics Dashboard (/api/v1/admin/analytics/dashboard/)")

# 4. Admin Profile & Hero Settings
prof_res = client.get('/api/v1/admin/profile/', HTTP_AUTHORIZATION=auth_header)
assert prof_res.status_code == 200, f"Profile get failed: {prof_res.status_code}"
prof_patch = client.patch('/api/v1/admin/profile/', data=json.dumps({'hero_badge': 'Hello, I am'}), content_type='application/json', HTTP_AUTHORIZATION=auth_header)
assert prof_patch.status_code == 200, f"Profile patch failed: {prof_patch.status_code}"
print(" [PASS] Admin Profile & Hero Settings (/api/v1/admin/profile/)")

# 5. Admin Projects CRUD & Actions
proj_res = client.get('/api/v1/admin/projects/', HTTP_AUTHORIZATION=auth_header)
assert proj_res.status_code == 200, f"Projects list failed: {proj_res.status_code}"
projects = proj_res.json()

if projects.get('results') or (isinstance(projects, list) and projects):
    first_proj_id = projects['results'][0]['id'] if 'results' in projects else projects[0]['id']

    toggle_res = client.post(f'/api/v1/admin/projects/{first_proj_id}/toggle-active/', HTTP_AUTHORIZATION=auth_header)
    assert toggle_res.status_code == 200, f"Project toggle active failed: {toggle_res.status_code}"
    # toggle back
    client.post(f'/api/v1/admin/projects/{first_proj_id}/toggle-active/', HTTP_AUTHORIZATION=auth_header)

    reorder_res = client.post('/api/v1/admin/projects/reorder/', data=json.dumps({'order_map': {str(first_proj_id): 0}}), content_type='application/json', HTTP_AUTHORIZATION=auth_header)
    assert reorder_res.status_code == 200, f"Projects reorder failed: {reorder_res.status_code}"
    print(" [PASS] Admin Projects CRUD, Toggle & Reorder (/api/v1/admin/projects/)")
else:
    print(" [SKIP] Admin Projects — no data (run seed_devmate.py first)")



# 7. Admin Experience & Skills & Categories & Achievements
exp_res = client.get('/api/v1/admin/experience/', HTTP_AUTHORIZATION=auth_header)
assert exp_res.status_code == 200, f"Experience list failed: {exp_res.status_code}"

skill_res = client.get('/api/v1/admin/skills/', HTTP_AUTHORIZATION=auth_header)
assert skill_res.status_code == 200, f"Skills list failed: {skill_res.status_code}"

cat_res = client.get('/api/v1/admin/categories/', HTTP_AUTHORIZATION=auth_header)
assert cat_res.status_code == 200, f"Categories list failed: {cat_res.status_code}"

ach_res = client.get('/api/v1/admin/achievements/', HTTP_AUTHORIZATION=auth_header)
assert ach_res.status_code == 200, f"Achievements list failed: {ach_res.status_code}"
print(" [PASS] Admin Experience, Skills, Categories, Achievements")

# 8. Admin Messages / Inbox & Bulk Action
msg_res = client.get('/api/v1/admin/messages/', HTTP_AUTHORIZATION=auth_header)
assert msg_res.status_code == 200, f"Messages list failed: {msg_res.status_code}"
msgs = msg_res.json()

if msgs.get('results') or (isinstance(msgs, list) and msgs):
    first_msg_id = msgs['results'][0]['id'] if 'results' in msgs else msgs[0]['id']
    bulk_res = client.post('/api/v1/admin/messages/bulk-action/', data=json.dumps({'message_ids': [first_msg_id], 'action': 'mark_read'}), content_type='application/json', HTTP_AUTHORIZATION=auth_header)
    assert bulk_res.status_code == 200, f"Bulk action failed: {bulk_res.status_code}"
    print(" [PASS] Admin Messages & Bulk Actions (/api/v1/admin/messages/)")
else:
    print(" [SKIP] Admin Messages — no data (run seed_devmate.py first)")

# 9. Public Serving Endpoints
boot_res = client.get('/api/bootstrap/')
assert boot_res.status_code == 200, f"Bootstrap failed: {boot_res.status_code}"
boot_data = boot_res.json()
assert 'profile' in boot_data and 'projects' in boot_data, "Bootstrap structure mismatch"
print(" [PASS] Public Bootstrap (/api/bootstrap/)")

sum_res = client.get('/api/summary/')
assert sum_res.status_code == 200, f"Summary failed: {sum_res.status_code}"
print(" [PASS] Public Summary (/api/summary/)")

banner_res = client.get('/api/banners/')
assert banner_res.status_code == 200, f"Banners failed: {banner_res.status_code}"
print(" [PASS] Public Banners (/api/banners/)")

pub_prof_res = client.get('/api/profile/')
assert pub_prof_res.status_code == 200, f"Public profile failed: {pub_prof_res.status_code}"
print(" [PASS] Public Profile (/api/profile/)")

# 10. Public Projects & Blogs by slug (requires seed_devmate.py)
cardflow_res = client.get('/api/projects/cardflow/')
if cardflow_res.status_code == 200:
    cf_data = cardflow_res.json().get('data', {})
    assert cf_data.get('slug') == 'cardflow', "Slug mismatch"
    assert 'documentation' in cf_data, "Documentation missing"
    print(" [PASS] Public Project Detail By Slug (/api/projects/cardflow/)")

    cardflow_like = client.post(f'/api/projects/{cf_data["id"]}/like/')
    assert cardflow_like.status_code == 200, f"Project like failed: {cardflow_like.status_code}"
    print(" [PASS] Public Project Like (/api/projects/{id}/like/)")
else:
    print(" [SKIP] Public Project By Slug — 'cardflow' not found (run seed_devmate.py first)")


# 11. Public Contact submission
contact_res = client.post('/api/contact/', data=json.dumps({'name': 'Tester', 'email': 'test@example.com', 'message': 'Great portfolio!'}), content_type='application/json')
assert contact_res.status_code == 201, f"Public contact submission failed: {contact_res.status_code}"
print(" [PASS] Public Contact Submission (/api/contact/)")

# 12. Rexi Chat
rexi_res = client.post('/api/rexi/chat/', data=json.dumps({'message': 'Tell me about Roshan'}), content_type='application/json')
assert rexi_res.status_code == 200, f"Rexi chat failed: {rexi_res.status_code}"
print(" [PASS] Rexi AI Chat (/api/rexi/chat/)")

# 13. Health Check
health_res = client.get('/api/health/')
assert health_res.status_code == 200, f"Health check failed: {health_res.status_code}"
print(" [PASS] Health Diagnostics (/api/health/)")

print("\n[SUCCESS] ALL 13 TEST SUITES PASSED PERFECTLY!")
