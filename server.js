const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors({ origin: '*' })); // السماح لكل الصفحات بالوصول
app.use(express.json());

// Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const ADMIN_NAME = process.env.ADMIN_NAME || "Bessam";

// ========================
// Endpoint لطرد المستخدم
// ========================
app.post('/kickUser', async (req, res) => {
  const { targetUsername, callerUsername } = req.body;

  // التحقق من صلاحية المشرف
  if (callerUsername !== ADMIN_NAME) return res.status(403).send({ message: "غير مصرح لك" });

  try {
    // البحث عن المستخدم في قاعدة البيانات
    const snapshot = await db.ref('users').orderByChild('name').equalTo(targetUsername).once('value');
    if (!snapshot.exists()) return res.status(404).send({ message: "المستخدم غير موجود" });

    const userId = Object.keys(snapshot.val())[0];

    // طرد المستخدم: إضافة إلى kickedUsers وحذفه من users
    await db.ref(`kickedUsers/${userId}`).set(true);
    await db.ref(`users/${userId}`).remove();

    res.send({ message: `تم طرد ${targetUsername}` });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "حدث خطأ أثناء الطرد" });
  }
});

// ========================
// تشغيل الخادم
// ========================
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
