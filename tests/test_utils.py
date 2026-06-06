import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.mylib import greet

def test_greet():
    assert greet("שלי") == "שלום, שלי!"
