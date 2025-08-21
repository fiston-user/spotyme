import { Router, Request, Response } from "express";

const router: Router = Router();

// Serve Android App Links verification file
router.get("/.well-known/assetlinks.json", (req: Request, res: Response) => {
  // This file is required for Android App Links verification
  // The SHA256 fingerprint should be from your app's signing certificate
  // You can get it using: eas credentials -p android
  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.anonymous.spotyme",
        // This fingerprint is a placeholder - replace with your actual app's SHA256 fingerprint
        // Get it from: eas credentials -p android
        sha256_cert_fingerprints: [
          "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C"
        ]
      }
    }
  ];

  res.setHeader("Content-Type", "application/json");
  res.json(assetlinks);
});

export default router;