import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ReferralService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  static const String _referralKey = 'has_prompted_referral';

  /// Determines if the referral dialog should be shown to the user.
  /// Result is true if the user is logged in, has not been prompted in this install
  /// (shared_prefs) and has no referralCode in Firestore.
  Future<bool> shouldShowReferralDialog() async {
    final user = _auth.currentUser;
    // Don't show if not logged in (e.g. skipped login)
    if (user == null) return false;

    final prefs = await SharedPreferences.getInstance();
    // Don't show if already prompted in this install
    if (prefs.getBool(_referralKey) ?? false) return false;

    // Check Firestore for existing referral (in case of fresh install/reinstall)
    final userDoc = await _db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data()?['referralCode'] != null) {
      // User has already entered a code previously, update prefs and don't show
      await prefs.setBool(_referralKey, true);
      return false;
    }

    return true;
  }

  /// Locally mark the user as 'prompted' to ensure we only show the dialog once.
  Future<void> markReferralPrompted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_referralKey, true);
  }

  /// Submits the referral code and updates both the executive's count
  /// and the user's document in a single atomic transaction.
  Future<void> submitReferralCode(String code) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    // Find the executive matching the code
    final execQuery = await _db
        .collection('executives')
        .where('myReferralCode', isEqualTo: code)
        .limit(1)
        .get();

    if (execQuery.docs.isEmpty) {
      throw Exception('Invalid referral code');
    }

    final execDoc = execQuery.docs.first;
    final execRef = execDoc.reference;
    final userRef = _db.collection('users').doc(user.uid);

    // Perform atomic transaction
    await _db.runTransaction((transaction) async {
      final freshExecDoc = await transaction.get(execRef);
      final currentCount = freshExecDoc.data()?['totalInstallCount'] ?? 0;

      transaction.update(execRef, {'totalInstallCount': currentCount + 1});
      transaction.set(userRef, {
        'referralCode': code,
        'email': user.email,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    });

    // Mark as prompted locally so it doesn't show again
    await markReferralPrompted();
  }
}
