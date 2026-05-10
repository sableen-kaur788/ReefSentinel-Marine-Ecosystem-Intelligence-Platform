"""Repository root and standard directories (layout: data/, scripts/, lib/, notebooks/)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CORALSCAPES = DATA / "coralscapes"
CORALSCAPES_6CLASS = DATA / "coralscapes_6class_dataset"
OUTPUTS = ROOT / "outputs"
NOTEBOOKS = ROOT / "notebooks"
SCRIPTS = ROOT / "scripts"
