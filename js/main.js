'use strict';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB73SRtNFdvCH14o6orbIaQ3KzG_98Y43M",
  authDomain: "glassfinder-d5927.firebaseapp.com",
  databaseURL: "https://glassfinder-d5927.firebaseio.com",
  projectId: "glassfinder-d5927",
  storageBucket: "glassfinder-d5927.appspot.com",
  messagingSenderId: "63645189116",
  appId: "1:63645189116:web:a86a52d6cdc49a529ea879"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const collection = db.collection('glassFinder');

// canvasのURLを所得する関数
const changeImage = (canvas) => {
  const png = canvas.toDataURL();
  console.log('png', png);
  return png;
};

// 顔を検出して画像を重ね合わせる関数
let imgLoad = function (source, ctx) {
  // 写真の取り込み
  const image = new Image();
  image.src = source;
  image.onload = function () {
    // 顔の検出
    var face_info = ccv.detect_objects({
      "canvas": ccv.grayscale(ccv.pre(image)),
      "cascade": cascade,
      "interval": 5,
      "min_neighbors": 1,
    });

    // 画像
    ctx.drawImage(image, 0, 0);

    // メガネ画像を重ねる
    const glassImage = new Image();
    glassImage.src = "./images/hanamegane.png";
    glassImage.onload = function () {
      for (var i = 0; i < face_info.length; i++) {
        ctx.drawImage(glassImage, face_info[i].x - 15, face_info[i].y + 30, face_info[i].width + 30, face_info[i].height - 50);
      }
    }
    if (face_info.length === 0) {
      alert('顔認識できないよ！');
    }
  };
  const png = changeImage(picture);
  return png;
}


window.onload = () => {
  const video = document.querySelector("#camera");
  const picture = document.querySelector('#picture');
  const se = document.querySelector('#se');

  // カメラ設定
  const constraints = {
    audio: false,
    video: {
      width: 640,
      height: 480,
      facingMode: "user" //フロントカメラを利用する
      // facingMode: {exact: "environment"} //リアカメラを利用する
    }
  };

  // カメラを<video></video>と同期
  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      video.srcObject = stream;
      video.onloadedmetadata = (e) => {
        video.play();
      };
    })
    .catch((err) => {
      console.log(err.name + ":" + err.message);
    });

  // シャッターボタン
  document.querySelector('#shutter').addEventListener('click', () => {
    const ctx = picture.getContext('2d');

    // 映像を止めてSEを再生する
    video.pause();  //映像を停止
    se.play(); //シャッター音
    setTimeout(() => {
      video.play();  //0.5秒後にカメラ再開
    }, 500);
    console.log('video', video);
    // pictureに画像を貼り付ける
    ctx.drawImage(video, 0, 0, picture.width, picture.height);

    // pictureのURLをとる
    const png = changeImage(picture);
    console.log(png);

    // 重ねたcanvas データのURLをとる
    const canvas = imgLoad(png, ctx);

    // 画面検出の関数
    const data = {
      src: canvas,
      time: firebase.firestore.FieldValue.serverTimestamp(),
    };
    // firebaseに保存
    collection.add(data);
  });

  collection.onSnapshot(function (querySnapshot) {
    let i = 0;
    querySnapshot.docs.forEach(function (doc) {
      const id = i;
      const data = doc.data();
      const imageCanvas = document.getElementById(`${id + 1}`);
      const ctx = imageCanvas.getContext('2d');
      // 再度画像認識させる関数へ送る
      imgLoad(data.src, ctx);
      i++;
    });
  });
};