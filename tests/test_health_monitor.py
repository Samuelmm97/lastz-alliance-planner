import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('health_monitor', Path(__file__).parents[1] / 'ops' / 'health_monitor.py')
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)

class HealthTests(unittest.TestCase):
    def test_missing_levels_are_failures_even_when_read_completed(self):
        self.assertTrue(monitor.failure({'kind':'reading_completed','details':{'cards':11,'missingLevels':11,'mode':'text'}}))
        self.assertFalse(monitor.failure({'kind':'reading_completed','details':{'cards':14,'missingLevels':0,'mode':'grid'}}))
        self.assertFalse(monitor.failure({'kind':'reading_completed','details':{'cards':0,'mode':'manual'}}))
        self.assertFalse(monitor.failure({'kind':'reading_cancelled'}))

    def test_retries_group_and_acknowledged_events_do_not_relaunch(self):
        e={'kind':'reading_completed','code':'3105a776b57d4453','version':'6371478','details':{'mode':'text','cards':11,'missingLevels':11},'created_at':1791200000000}
        groups=monitor.pending([e,{**e,'created_at':e['created_at']+1000}],{})
        self.assertEqual(len(groups),1)
        self.assertEqual(monitor.pending([e],{'seen':{monitor.incident_key(e):1}}),{})
        self.assertEqual(len(monitor.pending([e,{**e,'code':'another-member'}],{})),2)

if __name__ == '__main__':
    unittest.main()
