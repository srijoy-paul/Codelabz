import React, { useEffect, useRef, useState } from "react";
import "../../css/firepad.css";
import "../../css/firepad-userlist.css";
import "codemirror/lib/codemirror.css";
import { useFirebase } from "react-redux-firebase";
import CodeMirror from "codemirror";
import { useSelector } from "react-redux";
import { Row, Col } from "antd";
import { Prompt } from "react-router-dom";
import UserList from "./UserList";

const Editor = ({ id }) => {
  const [allSaved, setAllSaved] = useState(true);
  const [synced, setSynced] = useState(false);

  const firebase = useFirebase();
  const editorRef = useRef(null);
  // const usersRef = useRef(null);
  let noteID = id || "test_note";

  const currentUserHandle = useSelector(
    ({
      firebase: {
        profile: { handle },
      },
    }) => handle
  );

  const displayName = useSelector(
    ({
      firebase: {
        profile: { displayName },
      },
    }) => displayName
  );

  const photoURL = useSelector(
    ({
      firebase: {
        profile: { photoURL },
      },
    }) => photoURL
  );

  useEffect(() => {
    let firepad;
    window.CodeMirror = CodeMirror;
    require("codemirror/mode/gfm/gfm");
    window.firebase = firebase;

    let ref = firebase.database().ref().child("notes");

    const codeMirror = CodeMirror(editorRef.current, {
      mode: {
        name: "gfm",
        tokenTypeOverrides: {
          emoji: "emoji",
        },
      },
      lineNumbers: true,
      theme: "default",
    });

    const script = document.createElement("script");
    script.src = "/firepad.js";
    script.async = true;
    script.onload = () => {
      const firepadRef = ref.child(noteID);

      firepad = window.Firepad.fromCodeMirror(firepadRef, codeMirror, {
        richTextToolbar: false,
        richTextShortcuts: true,
        userId: currentUserHandle,
      });

      firepad.on("ready", function () {
        if (firepad.isHistoryEmpty()) {
          firepad.setHtml(
            '<span style="font-size: 24px;">Rich-text editing with <span style="color: red">Firepad!</span></span><br/><br/>Collaborative-editing made easy.\n'
          );
        }
      });

      firepad.on("synced", function (isSynced) {
        setSynced(isSynced);
        console.log(firepad.getHtml());
      });
    };

    document.body.appendChild(script);
    return () => {
      firepad && firepad.dispose();
      document.body.removeChild(script);
    };
  }, [firebase, currentUserHandle, displayName, noteID]);

  useEffect(() => {
    setAllSaved(true);
    // const confirmBeforeExit = (e) => {
    //   e.preventDefault();
    //   e.returnValue = "";
    // };
    // window.addEventListener("beforeunload", confirmBeforeExit);

    return () => {
      // window.removeEventListener("beforeunload", confirmBeforeExit);
    };
  }, [noteID]);

  return (
    <div>
      <Prompt
        when={!allSaved}
        message="You have unsaved changes, are you sure you want to leave?"
      />
      <Row>
        <Col xs={0} md={6} className="col-pad-24">
          <UserList
            currentUserHandle={currentUserHandle}
            displayName={displayName}
            firebase={firebase}
            noteID={noteID}
            photoURL={photoURL}
          />
        </Col>
        <Col xs={24} md={18} className="col-pad-24">
          {synced ? "Saved as a draft" : "Saving..."}
          <div id="firepad-container" ref={editorRef} />
        </Col>
      </Row>
    </div>
  );
};

export default Editor;
