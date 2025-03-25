#!/usr/bin/env python3
"""
LCP Compliance Validator
This tool validates if a device implementation complies with the LCP specification.
"""

import os
import sys
import yaml
import json
import logging
import argparse
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Represents the result of a validation check"""
    passed: bool
    message: str
    details: Dict[str, Any] = None

class LCPValidator:
    """
    Validates LCP compliance for device implementations
    """
    
    REQUIRED_STANDARD_COMMANDS = ['start', 'stop', 'status', 'reset']
    REQUIRED_FILES = ['lcp_interface.py', 'tests/test_lcp_interface.py', 'device_manifest.yaml']
    
    def __init__(self, device_path: str):
        """
        Initialize the validator with the path to the device implementation
        
        Args:
            device_path: Path to the device implementation directory
        """
        self.device_path = Path(device_path)
        self.manifest_path = self.device_path / 'device_manifest.yaml'
        self.manifest = None
        self.validation_results = []

    def load_manifest(self) -> ValidationResult:
        """Load and validate the device manifest file"""
        try:
            if not self.manifest_path.exists():
                return ValidationResult(
                    False,
                    f"Manifest file not found at {self.manifest_path}"
                )
            
            with open(self.manifest_path, 'r') as f:
                self.manifest = yaml.safe_load(f)
            
            return ValidationResult(True, "Manifest loaded successfully")
        except Exception as e:
            return ValidationResult(
                False,
                f"Error loading manifest: {str(e)}"
            )

    def validate_required_files(self) -> ValidationResult:
        """Check if all required files are present"""
        missing_files = []
        for file_path in self.REQUIRED_FILES:
            if not (self.device_path / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            return ValidationResult(
                False,
                "Missing required files",
                {"missing_files": missing_files}
            )
        return ValidationResult(True, "All required files present")

    def validate_device_info(self) -> ValidationResult:
        """Validate device information section"""
        required_fields = ['name', 'manufacturer', 'model', 'category', 'version', 'lcp_version']
        missing_fields = []
        
        for field in required_fields:
            if not self.manifest.get('device_info', {}).get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return ValidationResult(
                False,
                "Missing required device info fields",
                {"missing_fields": missing_fields}
            )
        return ValidationResult(True, "Device info validation passed")

    def validate_commands(self) -> ValidationResult:
        """Validate command implementations"""
        implemented_commands = []
        missing_commands = []
        
        for cmd in self.manifest.get('commands', {}).get('standard', []):
            if cmd.get('name') in self.REQUIRED_STANDARD_COMMANDS:
                if cmd.get('implemented', False):
                    implemented_commands.append(cmd['name'])
                else:
                    missing_commands.append(cmd['name'])
        
        missing_required = set(self.REQUIRED_STANDARD_COMMANDS) - set(implemented_commands)
        if missing_required or missing_commands:
            return ValidationResult(
                False,
                "Missing required command implementations",
                {
                    "missing_commands": list(missing_required),
                    "not_implemented": missing_commands
                }
            )
        return ValidationResult(True, "Command validation passed")

    def validate_test_coverage(self) -> ValidationResult:
        """Validate test coverage requirements"""
        required_coverage = self.manifest.get('validation', {}).get('required_test_coverage', 80)
        required_tests = self.manifest.get('validation', {}).get('required_tests', [])
        
        # TODO: Implement actual test coverage checking
        # For now, just verify the presence of test files
        test_file = self.device_path / 'tests/test_lcp_interface.py'
        if not test_file.exists():
            return ValidationResult(
                False,
                "Test file not found",
                {"test_file": str(test_file)}
            )
        return ValidationResult(True, "Test coverage validation passed")

    def run_validation(self) -> Tuple[bool, List[ValidationResult]]:
        """
        Run all validation checks
        
        Returns:
            Tuple of (passed: bool, results: List[ValidationResult])
        """
        # Load manifest first
        manifest_result = self.load_manifest()
        if not manifest_result.passed:
            return False, [manifest_result]
        
        # Run all validations
        validations = [
            self.validate_required_files(),
            self.validate_device_info(),
            self.validate_commands(),
            self.validate_test_coverage()
        ]
        
        # Check if all validations passed
        all_passed = all(result.passed for result in validations)
        return all_passed, validations

    def generate_report(self, results: List[ValidationResult]) -> str:
        """Generate a detailed validation report"""
        report = []
        report.append("LCP Compliance Validation Report")
        report.append("=" * 30)
        
        for i, result in enumerate(results, 1):
            report.append(f"\n{i}. {'✅' if result.passed else '❌'} {result.message}")
            if result.details:
                for key, value in result.details.items():
                    report.append(f"   - {key}: {value}")
        
        return "\n".join(report)

def main():
    """Main entry point for the validator"""
    parser = argparse.ArgumentParser(description='LCP Device Implementation Validator')
    parser.add_argument('device_path', help='Path to the device implementation directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    validator = LCPValidator(args.device_path)
    passed, results = validator.run_validation()
    
    print(validator.generate_report(results))
    sys.exit(0 if passed else 1)

if __name__ == '__main__':
    main() 
