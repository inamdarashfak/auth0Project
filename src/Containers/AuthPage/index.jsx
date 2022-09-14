import React, { useState, useEffect, useContext } from "react";
import "./index.css";
import { manualLogin } from "../../Auth0/auth0";
import { loginGoogle, loginGoogleAuth } from "../../Auth0/auth0-spa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserExists, db } from "../../utils/firebase";
import {
  validateEmail,
  passwordValidation,
  validateName,
} from "../../utils/validations";
import LogIn from "../../Components/Login";
import SignUp from "../../Components/SignUp";
import ForgotPassword from "../../Components/ForgotPassword";
import auth0 from "auth0-js";
import { getToken } from "../../Auth0/auth0-spa";
import { getAuth0Token } from "../../utils/localStorage";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { collection, addDoc, Timestamp } from "firebase/firestore";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [signUpFormData, setSignUpFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [signUpFormDataError, setSignUpFormDataError] = useState({
    isValidName: true,
    isValidLastname: true,
    isValidEmail: true,
    isValidPassword: true,
  });
  const [formError, setFormError] = useState({
    isEmailValid: true,
    isPasswordValid: true,
  });
  const [loader, setLoader] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [forgotPass, setForgotPass] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [isSocial, setIsSocial] = useState(false);
  const [auth, setAuth] = useState({});
  const navigate = useHistory();

  useEffect(() => {
    let path = window.location.pathname;
    if (path === "/social") {
      setSignUp(true);
      setIsSocial(true);
      fetchData();
    } else {
      localStorage.clear();
    }

    async function fetchData() {
      setLoader(true);
      const FormData = { ...signUpFormData };
      await getToken().then(async (data) => {
        setLoader(false);
        let authResponse = await getAuth0Token();
        let user = await authResponse;

        setAuth(user);
        FormData.firstName = authResponse.body.decodedToken.user.given_name;
        FormData.lastName = authResponse.body.decodedToken.user.family_name;
        FormData.email = authResponse.body.decodedToken.user.email;

        setSignUpFormData(FormData);
      });
    }
  }, []);

  const handleOnChange = (e) => {
    const FormData = { ...formData };
    const FormError = { ...formError };

    FormData[e.target.name] = e.target.value;
    setFormData(FormData);
    setFormError(FormError);
  };

  const handleSignUpOnChange = (e) => {
    let dataToSet = e.target.value;
    let data = { ...signUpFormData };
    data[e.target.name] = dataToSet;
    setSignUpFormData(data);
  };

  const handleSubmit = async () => {
    const FormData = { ...formData };
    const FormError = { ...formError };
    setLoader(true);
    FormError.isEmailValid = validateEmail(FormData.email);
    FormError.isPasswordValid = passwordValidation(FormData.password);
    console.log("csd", FormError);
    if (!FormError.isEmailValid || !FormError.isPasswordValid) {
      toast.error("Please enter a valid email or password");
      return;
    }
    setFormData(FormData);
    setFormError(FormError);

    let user = await checkUserExists(formData.email);

    if (user === undefined) {
      setLoader(false);
      toast.error("Incorrect email or password");
      return;
    }
    if (user?.isSocial) {
      setLoader(false);
      toast.error("This email uses social log in, please login with google");
      return;
    }

    try {
      setLoader(true);
      localStorage.clear();
      localStorage.setItem("auth_mode", "manual");
      localStorage.setItem("type", "login");
      localStorage.setItem("authEmail", formData?.email);
      await manualLogin({
        connection: "Username-Password-Authentication",
        username: formData?.email,
        password: formData?.password,
        grant_type: "password",
      });
    } catch (err) {
      setLoader(false);
      localStorage.removeItem("manual_mode");

      if (err.description === "Wrong email or password.") {
        toast.error("Wrong email or password");

        setLoader(false);
      } else {
        setLoader(false);
        toast.error("Wrong email or password");
      }
    }
  };

  const handleSignUpSubmit = async () => {
    const FormData = { ...signUpFormData };
    const FormError = { ...signUpFormDataError };
    FormError.isValidEmail = validateEmail(FormData.email);
    FormError.isValidPassword = passwordValidation(FormData.password);
    FormError.isValidName = validateName(FormData.firstName);
    FormError.isValidLastname = validateName(FormData.lastName);

    if (!FormError.isValidEmail) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!FormError.isValidLastname) {
      toast.error("Please enter a valid lastname");
      return;
    }
    if (!FormError.isValidName) {
      toast.error("Please enter a valid firstname");
      return;
    }
    if (!FormError.isValidPassword) {
      toast.error("Please enter a valid password");
      return;
    }
    setLoader(true);
    let user = await checkUserExists(FormData.email);

    if (user !== undefined) {
      toast.error("User already exists");
      setLoader(false);
      return;
    }

    localStorage.clear();
    let settingURL = process.env.PUBLIC_URL + "/setting.json";
    const response = await fetch(settingURL);
    const data = await response.json();
    var webAuth = new auth0.WebAuth({
      domain: data.REACT_APP_AUTH0_DOMAIN,
      clientID: data.REACT_APP_AUTH0_CLIENT,
    });

    webAuth.signup(
      {
        connection: "Username-Password-Authentication",
        email: FormData?.email,
        password: FormData?.password,
        username: FormData?.email,
        given_name: FormData?.firstName,
        family_name: FormData?.lastName,
        name: FormData?.firstName + " " + FormData?.lastName,
        email_verified: true,
        password_history: true,
      },
      async function (err, result) {
        if (err) {
          toast.error("User already exists");
          setLoader(false);
        } else {
          localStorage.setItem("auth_mode", "manual");
          localStorage.setItem("firstName", FormData?.firstName);
          localStorage.setItem("lastName", FormData?.lastName);
          localStorage.setItem("authEmail", FormData?.email);
          setLoader(false);
          await manualLogin({
            connection: "Username-Password-Authentication",
            username: FormData?.email,
            password: FormData?.password,
            client_id: data.REACT_APP_AUTH0_CLIENT,
            grant_type: "password",
          });
        }
      }
    );
  };
  const switchToForgotPassword = () => {
    setForgotPass(!forgotPass);
    setReqSuccess(false);
    let FormData = { ...formData };

    FormData.email = "";
    FormData.password = "";
    setFormData(FormData);
  };

  const authZeroResetPassword = async (email) => {
    const FormData = { ...formData };
    const FormError = { ...formError };
    FormError.isEmailValid = validateEmail(FormData.email);

    if (!FormError.isEmailValid) {
      toast.error("Please enter a valid email");
      return;
    }
    let user = await checkUserExists(FormData.email);

    if (user === undefined) {
      toast.error("User does not exists");

      return;
    }

    if (user && user.isSocial) {
      toast.error("This email uses social login.");

      return;
    }
    setLoader(true);
    let settingURL = process.env.PUBLIC_URL + "/setting.json";
    const response = await fetch(settingURL);
    const data = await response.json();
    var webAuth = new auth0.WebAuth({
      domain: data.REACT_APP_AUTH0_CUSTOM_DOMAIN,
      clientID: data.REACT_APP_AUTH0_CLIENT,
      redirectUri: data.REACT_APP_FORGOT_PASSWORD_URL,
    });

    webAuth.changePassword(
      { connection: "Username-Password-Authentication", email: FormData.email },
      function (err, res) {
        if (err) {
          setLoader(false);
          console.log(err);
        } else {
          setReqSuccess(true);
          setLoader(false);
        }
      }
    );
  };

  const switchSignUp = () => {
    localStorage.clear();
    setSignUp(!signUp);
  };

  const handleLoginGoogle = (type) => {
    if (type === "SIGNUP") {
      loginGoogle(type);
    } else if (type === "LOGIN") {
      loginGoogleAuth();
    }
  };

  const goToHome = () => {
    navigate.push("/login", { replace: true });
    localStorage.clear();
    setIsSocial(false);
    setSignUp(false);
    let FormData = { ...setSignUpFormData };
    FormData.firstName = "";
    FormData.lastName = "";
    FormData.email = "";
    FormData.password = "";
    setSignUpFormData(FormData);
  };

  const handleSocialSignUp = async () => {
    let user = await checkUserExists(signUpFormData.email);
    let authResponse = await getAuth0Token();
    let profilePic = authResponse.body.decodedToken.user.picture;
    if (user !== undefined) {
      toast.error("User already exists");

      return;
    }

    try {
      await addDoc(collection(db, "userData"), {
        firstName: signUpFormData.firstName,
        lastName: signUpFormData.lastName,
        email: signUpFormData.email,
        isSocial: true,
        profilePic: profilePic,
        created: Timestamp.now(),
      });
      localStorage.setItem("authEmail", signUpFormData.email);
      await navigate.push("/dashboard", { replace: true });
    } catch (err) {
      console.log("dd", err);
    }
  };
  return (
    <div className="backgroundImage">
      <div className="mainLayout">
        {!forgotPass && !isSocial && (
          <div className="signUpText" onClick={switchSignUp}>
            {signUp ? (
              <div>Already have an account?</div>
            ) : (
              <div>Need an account?</div>
            )}
            <span style={{ marginLeft: "5px" }}>
              {signUp ? "Log In" : "Sign Up now"}
            </span>
          </div>
        )}

        {!forgotPass && !signUp ? (
          <LogIn
            handleOnChange={handleOnChange}
            handleSubmit={handleSubmit}
            handleLoginGoogle={() => handleLoginGoogle("LOGIN")}
            switchToForgotPassword={switchToForgotPassword}
            loader={loader}
          />
        ) : signUp ? (
          <SignUp
            handleSubmit={handleSignUpSubmit}
            handleSocialSignUp={handleSocialSignUp}
            handleOnChange={handleSignUpOnChange}
            handleLoginGoogle={() => handleLoginGoogle("SIGNUP")}
            signUpFormData={signUpFormData}
            isSocial={isSocial}
            goToHome={goToHome}
            loader={loader}
          />
        ) : (
          <ForgotPassword
            handleOnChange={handleOnChange}
            handleSubmit={authZeroResetPassword}
            switchToForgotPassword={switchToForgotPassword}
            reqSuccess={reqSuccess}
            loader={loader}
          />
        )}
      </div>
    </div>
  );
}

export default Login;
