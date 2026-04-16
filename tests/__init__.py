"""
This file marks the `tests/` directory as a Python package.

Test suite coverage:
- Unit tests for the RUT validation module (Chilean RUT algorithm, modulo 11)
- Integration tests for the Flask REST endpoint POST /api/validate-rut

Running the tests:
    Execute `pytest` from the root of the project to discover and run all tests.

Environment requirements:
    The test environment requires the environment variables defined in `.env`
    at the project root, or alternatively in a `.env.test` file for isolated
    test configuration.

Python version: Requires Python 3.11 or higher to run this test suite.
"""