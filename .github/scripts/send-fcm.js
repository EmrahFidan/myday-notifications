const https = require('https');
const fs = require('fs');

// User ID ve Project ID
const userId = 'f4ocg6ZtopVXJj55eO4HBF66qnq1';
const projectId = 'myday-cc640';

console.log('🚀 FCM Data Payload Bildirimi başlatılıyor...');
console.log('👤 User ID:', userId);

// Service Account JSON'ı parse et
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
console.log('✅ Service Account yüklendi');
console.log('📧 Service Account Email:', serviceAccount.client_email);

// OAuth 2.0 Access Token al
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const jwtHeader = Buffer.from(JSON.stringify({
      alg: 'RS256',
      typ: 'JWT'
    })).toString('base64url');

    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = Buffer.from(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).toString('base64url');

    const crypto = require('crypto');
    const signatureInput = jwtHeader + '.' + jwtClaimSet;
    const signature = crypto.createSign('RSA-SHA256')
      .update(signatureInput)
      .sign(serviceAccount.private_key, 'base64url');

    const jwt = signatureInput + '.' + signature;
    const postData = 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt;

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('✅ Access Token alındı');
          resolve(response.access_token);
        } else {
          console.error('❌ Access Token hatası:', res.statusCode, data);
          reject(new Error('Access token alınamadı: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Hardcoded FCM Token'ı al (GitHub Secret'tan)
function getFCMToken() {
  const fcmToken = process.env.FCM_TOKEN;

  if (!fcmToken) {
    throw new Error('❌ FCM_TOKEN environment variable bulunamadı! GitHub Secret olarak ekleyin.');
  }

  console.log('✅ FCM Token alındı (hardcoded):', fcmToken.substring(0, 20) + '...');
  return fcmToken;
}

// Firestore'dan görevleri oku
function getTasks(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: '/v1/projects/' + projectId + '/databases/(default)/documents/users/' + userId + '/tasks',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    };

    console.log('📚 Firestore\'dan görevler okunuyor...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          const tasks = [];

          if (response.documents) {
            const today = new Date().toISOString().split('T')[0];

            response.documents.forEach(doc => {
              const fields = doc.fields;
              const createdAt = fields.createdAt?.timestampValue || '';
              const taskDate = createdAt.split('T')[0];

              // Sadece bugünün görevlerini al
              if (taskDate === today) {
                tasks.push({
                  id: doc.name.split('/').pop(),
                  title: fields.title?.stringValue || '',
                  completed: fields.completed?.booleanValue || false,
                  order: parseInt(fields.order?.integerValue || '0'),
                  createdAt: createdAt
                });
              }
            });

            // Önce tamamlanmamışlar, sonra tamamlanmışlar - her ikisi de order'a göre
            tasks.sort((a, b) => {
              if (a.completed === b.completed) {
                return a.order - b.order;
              }
              return a.completed ? 1 : -1;
            });
          }

          console.log('✅ ' + tasks.length + ' görev bulundu');
          resolve(tasks);
        } else {
          console.error('❌ Firestore hatası:', res.statusCode, data);
          reject(new Error('Görevler okunamadı: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// FCM v1 API bildirim gönder
function sendNotification(accessToken, fcmToken, tasks) {
  return new Promise((resolve, reject) => {
    const incompleteTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    if (tasks.length === 0) {
      console.log('📭 Görev yok, bildirim gönderilmedi!');
      resolve('No tasks');
      return;
    }

    if (incompleteTasks.length === 0) {
      console.log('🎉 Tüm görevler tamamlandı, bildirim gönderilmedi!');
      resolve('All completed');
      return;
    }

    // Görev listesini formatla - özel karakterleri temizle
    const lines = [];
    incompleteTasks.forEach(task => {
      const safeTitle = task.title.replace(/["\\]/g, '').replace(/\n/g, ' ').trim();
      lines.push('☐ ' + safeTitle);
    });
    completedTasks.forEach(task => {
      const safeTitle = task.title.replace(/["\\]/g, '').replace(/\n/g, ' ').trim();
      lines.push('☑ ' + safeTitle);
    });

    console.log('📋 Görev listesi hazırlandı:', lines);

    // Bildirim body'si - görev listesi
    const notificationBody = lines.join('\n');
    const notificationTitle = 'MYday (' + incompleteTasks.length + ' görev)';

    // FCM v1 API FORMAT - notification payload ile (Android otomatik gösterir)
    // tag: 'myday-tasks' ile aynı tag'lı bildirimler birbirini replace eder
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        android: {
          priority: 'high',
          notification: {
            tag: 'myday-tasks',
            channelId: 'default',
            notificationCount: incompleteTasks.length
          }
        },
        data: {
          tasks: JSON.stringify(lines),
          incompleteCount: String(incompleteTasks.length),
          totalCount: String(tasks.length),
          type: 'task_update'
        }
      }
    };

    const messageData = JSON.stringify(message);

    const options = {
      hostname: 'fcm.googleapis.com',
      path: '/v1/projects/' + projectId + '/messages:send',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(messageData, 'utf8')
      }
    };

    console.log('📤 FCM v1 bildirim gönderiliyor...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Bildirim başarıyla gönderildi!');
          console.log('📊 Response:', data);
          resolve(data);
        } else {
          console.error('❌ FCM hatası:', res.statusCode);
          console.error('📄 Response:', data);
          reject(new Error('FCM gönderim hatası: ' + data));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ İstek hatası:', error);
      reject(error);
    });

    req.write(messageData);
    req.end();
  });
}

// Ana işlem
(async () => {
  try {
    const accessToken = await getAccessToken();
    const fcmToken = getFCMToken(); // Hardcoded token (GitHub Secret)
    const tasks = await getTasks(accessToken);
    await sendNotification(accessToken, fcmToken, tasks);
    console.log('✨ İşlem tamamlandı!');
  } catch (error) {
    console.error('💥 Hata:', error.message);
    process.exit(1);
  }
})();
