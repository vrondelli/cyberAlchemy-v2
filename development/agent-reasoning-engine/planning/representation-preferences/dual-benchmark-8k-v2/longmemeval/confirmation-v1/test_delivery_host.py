import unittest
from acquire_source import validate_url, AcquisitionError
class DeliveryHostTests(unittest.TestCase):
 def test_observed_official_delivery_host_exact(self):
  self.assertEqual(validate_url('https://us.aws.cdn.hf.co/object?opaque=signed'), 'us.aws.cdn.hf.co')
  for url in ['http://us.aws.cdn.hf.co/object','https://us.aws.cdn.hf.co.evil.invalid/object','https://user@us.aws.cdn.hf.co/object','https://us.aws.cdn.hf.co:444/object']:
   with self.assertRaises(AcquisitionError): validate_url(url)
