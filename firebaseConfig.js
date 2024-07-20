import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDYwrVUqa3MsF20uJ3ytBYnqP37mObP23w",
  authDomain: "recipe-web-app-fdddb.firebaseapp.com",
  projectId: "recipe-web-app-fdddb",
  storageBucket: "recipe-web-app-fdddb.appspot.com",
  messagingSenderId: "8910166849",
  appId: "1:8910166849:web:2f5951a8d352d3a5e25fc0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
