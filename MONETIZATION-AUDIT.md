# Monetization fixes — 17 October 2026

Implemented:
- Consent defaults execute in HTML before the AdSense loader, using Google's command format.
- Local preferences accept only boolean grants and no longer override advertising consent.
- Ad units wait for confirmed authentication, a verified free tier, and the CMP's TCF response. Session/subscription errors do not turn paying visitors into ad viewers.
- CMP updates and withdrawal remove ad units. A fresh ad element is initialized correctly if permission returns or a route changes its slot.
- The CMP must explicitly report gdprApplies=false outside its regulated region; unknown geography does not become permission. Within it, a completed storage consent and Google vendor consent are required. This is deliberately conservative, not an implementation of every limited-ad option.
- No response from a CMP means no ad units ANYWHERE. A console warning identifies the missing setup. This avoids relying on an uncertified banner but can reduce revenue until account setup is complete.
- Gear recommendations omit zero-score and incompatible products and remove the arbitrary newest-50 cutoff.
- Affiliate analytics require an opt-in and omit the user's account ID from click records. Direct shopping links work without tracking consent.
- Amazon OneLink only loads after the separate localization choice. Withdrawal reloads the page to remove its already-installed listeners.
- Amazon import URLs require a real supported Amazon hostname. Prices remain editorial bands and Amazon images remain local artwork.
- Hub ad slots are included in environment validation.

Account setup still required:
1. Sign in to AdSense and inspect the current Policy center/Sites status. The old repository rejection is not evidence of the current account status.
2. In Privacy & messaging, create/publish the European regulations message for anglerdeck.com with Consent, Do not consent and Manage options. Verify Google's automatically supplied revocation link works.
3. Enable Consent Mode for advertising in that message's settings. Local site analytics preferences remain separate; do not let two systems control the same analytics choice.
4. Keep Auto ads OFF, preserving the paid subscriber promise. Verify the publisher and ad unit IDs belong to this account.
5. Test the actual CMP in-region and out-of-region. The app cannot certify a CMP or publish its message using source code alone.
6. Verify Amazon Associates tags and international marketplace linking in the merchant account. Code tests cannot verify revenue attribution.

Verification and deployment results are reported in the task conversation. No database migration is required. Existing unrelated staged admin work is excluded from the monetization commit.

Sources:
- https://developers.google.com/tag-platform/security/guides/consent
- https://support.google.com/adsense/answer/10960768?hl=en
- https://support.google.com/adsense/answer/16053245?hl=en
- https://support.google.com/adsense/answer/10959060?hl=en
- https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md
