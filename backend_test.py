#!/usr/bin/env python3
"""
DagzFlix Backend API Testing Suite
Tests the Next.js API routes via the FastAPI proxy
"""
import requests
import sys
import json
from datetime import datetime
from urllib.parse import urljoin

class DagzFlixAPITester:
    def __init__(self):
        # Use the local backend proxy URL
        self.base_url = "http://localhost:8001"
        self.session = requests.Session()
        self.session.timeout = 30
        self.tests_run = 0
        self.tests_passed = 0
        self.cookies = {}
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_emoji = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
        print(f"[{timestamp}] {status_emoji.get(status, 'ℹ️')} {message}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = urljoin(self.base_url + "/", endpoint)
        self.tests_run += 1
        
        self.log(f"Testing {name}...")
        
        try:
            # Prepare headers
            req_headers = {'Content-Type': 'application/json'}
            if headers:
                req_headers.update(headers)
            
            # Make request
            if method == 'GET':
                response = self.session.get(url, headers=req_headers, cookies=self.cookies)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=req_headers, cookies=self.cookies)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=req_headers, cookies=self.cookies)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=req_headers, cookies=self.cookies)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check status code
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASS - {name} (Status: {response.status_code})", "PASS")
                
                # Store cookies for session management
                if response.cookies:
                    self.cookies.update(response.cookies.get_dict())
                    
                return True, response.json() if response.content else {}
            else:
                self.log(f"FAIL - {name} (Expected {expected_status}, got {response.status_code})", "FAIL")
                try:
                    error_data = response.json()
                    self.log(f"     Error: {error_data.get('error', 'Unknown error')}")
                except:
                    self.log(f"     Response: {response.text[:200]}")
                return False, {}
                
        except requests.exceptions.RequestException as e:
            self.log(f"FAIL - {name} - Network error: {str(e)}", "FAIL")
            return False, {}
        except Exception as e:
            self.log(f"FAIL - {name} - Error: {str(e)}", "FAIL")
            return False, {}

    def test_setup_routes(self):
        """Test setup and configuration endpoints"""
        self.log("=== Testing Setup Routes ===")
        
        # Test setup check
        success, data = self.run_test("Setup Check", "GET", "setup/check")
        if success:
            self.log(f"     Setup complete: {data.get('setupComplete', False)}")
            self.log(f"     Jellyfin configured: {data.get('jellyfinConfigured', False)}")
        
        return success

    def test_auth_routes(self):
        """Test authentication endpoints"""
        self.log("=== Testing Auth Routes ===")
        
        # Test session check (should be unauthenticated initially)
        success, data = self.run_test("Session Check (No Auth)", "GET", "auth/session")
        if success:
            self.log(f"     Authenticated: {data.get('authenticated', False)}")
        
        # Test login with empty credentials (should work based on code)
        login_success, login_data = self.run_test(
            "Login (Empty Credentials)", 
            "POST", 
            "auth/login",
            expected_status=400,  # Might fail due to server not configured
            data={"username": "", "password": ""}
        )
        
        return success

    def test_media_routes(self):
        """Test media endpoints (without authentication)"""
        self.log("=== Testing Media Routes ===")
        
        # Test favorites (should require auth)
        success, _ = self.run_test("Get Favorites (No Auth)", "GET", "media/favorites", expected_status=401)
        
        # Test library (should require auth)  
        success2, _ = self.run_test("Get Library (No Auth)", "GET", "media/library", expected_status=401)
        
        # Test genres (should require auth)
        success3, _ = self.run_test("Get Genres (No Auth)", "GET", "media/genres", expected_status=401)
        
        return success and success2 and success3

    def test_profile_routes(self):
        """Test profile endpoints"""
        self.log("=== Testing Profile Routes ===")
        
        # Test profile (should require auth)
        success, _ = self.run_test("Get Profile (No Auth)", "GET", "profile", expected_status=401)
        
        return success

    def test_admin_routes(self):
        """Test admin endpoints"""
        self.log("=== Testing Admin Routes ===")
        
        # Test admin stats (should require auth and admin role)
        success, _ = self.run_test("Get Admin Stats (No Auth)", "GET", "admin/stats", expected_status=401)
        
        # Test admin users (should require auth and admin role)
        success2, _ = self.run_test("Get Admin Users (No Auth)", "GET", "admin/users", expected_status=401)
        
        return success and success2

    def test_telemetry_routes(self):
        """Test telemetry endpoints"""
        self.log("=== Testing Telemetry Routes ===")
        
        # Test feedback endpoint (should require auth)
        success, _ = self.run_test(
            "Post Feedback (No Auth)", 
            "POST", 
            "telemetry/feedback",
            expected_status=401,
            data={"contentId": "test123", "genres": ["Action"]}
        )
        
        return success

    def run_all_tests(self):
        """Run the complete test suite"""
        self.log("🚀 Starting DagzFlix API Tests", "INFO")
        self.log(f"Backend URL: {self.base_url}")
        
        # Test different route groups
        setup_ok = self.test_setup_routes()
        auth_ok = self.test_auth_routes() 
        media_ok = self.test_media_routes()
        profile_ok = self.test_profile_routes()
        admin_ok = self.test_admin_routes()
        telemetry_ok = self.test_telemetry_routes()
        
        # Summary
        self.log("=" * 50)
        self.log(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All tests passed!", "PASS")
            return 0
        else:
            failed = self.tests_run - self.tests_passed
            self.log(f"💥 {failed} test(s) failed", "FAIL")
            return 1

def main():
    tester = DagzFlixAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())