const socket = io("http://localhost:3000/", {
  transports: ["websocket"],
});


socket.on("receivedMsg", (msg, userId) => {
  const ul = document.getElementById(userId);
  const li = document.createElement("li");
  li.className = "receive";
  let today = new Date();
  let hr = today.getHours() < 10 ? "0" + today.getHours() : today.getHours();
  let min =
    today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
  let time = hr + ":" + min;
  li.textContent = msg + " " + time;
  ul.append(li);
});

const searchBtn = document.getElementById("searchBtn");
const query = document.getElementById("query");
const search_users_list = document.getElementById("search_users_list");
const users_list = document.getElementsByClassName("users_list")[0];
const activeUserName = document.getElementById("profile_name");
const profile_pic = document.getElementById("profile_pic");
const groupBtn = document.getElementById("groupBtn");
const groupDiv = document.getElementById("groupDiv");
const logout = document.getElementById("logout");
const cleardata = document.getElementById("clearChatBtn");

cleardata.addEventListener("click", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");

  const selectedUserItem = document.querySelector(".users_list_item.selected");
  const otherUserId = selectedUserItem
    ? selectedUserItem.getAttribute("data-id")
    : null;

  if (!otherUserId) {
    alert("No user selected to clear chat.");
    return;
  }

  console.log("this --->", userId, otherUserId);

  fetch("http://localhost:3000/user/deleteChatMessages", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, otherUserId }),
  })
    .then((response) => response.text())
    .then((data) => {
      // console.log(data);
      socket.emit("clear-chat", { userId, otherUserId });
    })
    .catch((error) => console.error("Error:", error));
});

socket.on("deleteChatMessages", ({ userId, otherUserId }) => {
  // console.log(`Chat cleared for user ${userId} and ${otherUserId}`);
});

socket.on("error", (message) => {
  console.error(message);
});

logout.addEventListener("click", () => {
  window.location.href = "./index.html";
  localStorage.removeItem("token");
});

const url = new URLSearchParams(window.location.search);
const userId = url.get("id");

fetch(`http://localhost:3000/user/alreadyConnectedUser?userId=${userId}`)
  .then((response) => response.json())
  .then((response) => {
    activeUserName.textContent = response[1];
    profile_pic.src = response[2];
    renderConnectedUsers(response[0]);
  });

function openProfile(el, data_id, msg) {
  usersProfile.innerHTML = null;

  const nav = document.createElement("nav");
  nav.setAttribute("id", "usersHeader");

  const img = document.createElement("img");
  img.src = el.picture;
  img.style.width = "40px";
  const name = document.createElement("span");
  name.innerText = el.name;

  const div = document.createElement("div");
  div.setAttribute("id", "usersChat");
  const ul = document.createElement("ul");
  ul.setAttribute("id", data_id);

  if (msg != undefined) {
    msg.forEach(({ data, type }) => {
      // console.log(data, type);
      const li = document.createElement("li");
      li.textContent = data.message + " " + data.timestamp.substring(11, 16);
      li.className = type;
      ul.append(li);
    });
  }

  const footer = document.createElement("footer");
  footer.setAttribute("id", "usersFooter");

  const input = document.createElement("input");
  input.setAttribute("type", "text");

  const button = document.createElement("button");
  button.innerHTML = '<i class="fa-sharp fa-solid fa-paper-plane"></i>';

  const emojiButton = document.createElement("button");
  emojiButton.innerHTML = "😊";
  emojiButton.setAttribute("id", "emojiButton");

  button.addEventListener("click", () => {
    sendMessage(el, input, ul);
  });


  nav.append(img, name, cleardata);

  div.append(ul);
  footer.append(input, button, emojiButton);
  usersProfile.append(nav, div, footer);
}

function renderConnectedUsers(data) {
  users_list.innerHTML = null;

  data.forEach((user) => {
    const li = document.createElement("li");
    li.setAttribute("class", "users_list_item");
    li.setAttribute("data-id", user._id);

    const img = document.createElement("img");
    img.src = user.picture;
    img.setAttribute("class", "profile_pic");
    img.setAttribute("width", "50px");
    img.setAttribute("height", "50px");

    const name = document.createElement("p");
    name.textContent = user.name;

    li.addEventListener("click", () => {
      document
        .querySelectorAll(".users_list_item")
        .forEach((item) => item.classList.remove("selected"));
      li.classList.add("selected");

      fetch(
        `http://localhost:3000/user/getAllMessages?user1=${userId}&user2=${user._id}`
      )
        .then((res) => res.json())
        .then((res) => {
          openProfile(user, user._id, res);
        });
    });
    li.append(img, name);
    users_list.append(li);
  });
}
socket.emit("createConnection", userId);

searchBtn.addEventListener("click", () => {
  let search = query.value ? query.value : "";
  fetch(
    `http://localhost:3000/user/searchUser?search=${search}&userId=${userId}`,
    {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    }
  )
    .then((res) => res.json())
    .then((response) => {
      renderUsers(response);
    });
});

function renderUsers(users) {
  // console.log(users);
  search_users_list.innerHTML = null;

  users.forEach((user) => {
    const div = document.createElement("div");
    div.setAttribute("class", "users_list_container");

    const name = document.createElement("span");
    name.textContent = user.name;

    const img = document.createElement("img");
    img.src = user.picture;
    img.style.width = "50px";

    div.addEventListener("click", () => {
      query.value = "";
      search_users_list.innerHTML = null;

      fetch(
        `http://localhost:3000/user/getAllMessages?user1=${userId}&user2=${user._id}`
      )
        .then((res) => res.json())
        .then((messages) => {
          if (messages.length === 0) {
            const li = document.createElement("li");
            li.setAttribute("class", "users_list_item");

            const img = document.createElement("img");
            img.src = user.picture;
            img.setAttribute("class", "profile_pic");
            img.setAttribute("width", "50px");
            img.setAttribute("height", "50px");

            const name = document.createElement("p");
            name.textContent = user.name;

            li.addEventListener("click", () => {
              fetch(
                `http://localhost:3000/user/getAllMessages?user1=${userId}&user2=${user._id}`
              )
                .then((res) => res.json())
                .then((messages) => {
                  openProfile(user, user._id, messages);
                });
            });

            li.append(img, name);
            users_list.append(li);
          }

          // Open profile with messages
          openProfile(user, user._id, messages);
        });
    });

    div.append(img, name);
    search_users_list.append(div);
  });
}

function sendMessage(el, input, ul) {
  const li = document.createElement("li");
  let today = new Date();
  let hours = today.getHours();
  let minutes = today.getMinutes();
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  let time = hours + ":" + minutes + " " + ampm;

  li.className = "send";
  li.textContent = input.value + " " + time;
  ul.append(li);
  socket.emit("chatMsg", input.value, el._id, userId);
  input.value = "";
}

function createGroup() {
  const url = new URLSearchParams(window.location.search);
  const userId = url.get("id");
  fetch(`http://localhost:3000/user/allUser?userId=${userId}`)
    .then((res) => res.json())
    .then((response) => {
      renderGroupUsers(response);
    });
}

function renderGroupUsers(users) {
  groupDiv.innerHTML = null;
  users.forEach((el) => {
    const img = document.createElement("img");
    img.src = el.picture;
    img.style.width = "60px";
    const name = document.createElement("span");
    name.innerText = el.name;
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    groupDiv.append(img, name, addBtn);
  });
}
