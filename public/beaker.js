//get all camera devices
const urlParams = new URLSearchParams(window.location.search);

let cameraDevices = [];
// let containObjectList = [];

const recognitionButton = document.getElementById("recognition-button");
// const sendButton = document.getElementById("send-button");
const mixButton = document.getElementById("mix-button");
const usernameInput = document.getElementById("username");
const partycodeInput = document.getElementById("partycode");
const comfyImage = document.getElementById("comfy-image");

const testDataDiv = document.getElementById("testData");
const loadingDiv = document.getElementById("loadingBG");
const loadingText = document.getElementById("loadingText");

//calculate the pixel between sendButto and partycodeInput
let recognitionButtonTop = recognitionButton.getBoundingClientRect().top;
let partycodeInputBottom = partycodeInput.getBoundingClientRect().bottom;
let distance = recognitionButtonTop - partycodeInputBottom;

let mixing = false;

const loadingMessages = [
  // Mysterious and Intriguing
  "The cauldron of creativity bubbles... what will emerge?",
  "The cosmic forces are aligning... prepare for the unexpected!",
  "From chaos comes creation—stand by for the impossible!",
  "Gears are turning, sparks are flying... something wondrous is on the way!",
  "Reality bends, and new possibilities are born. Almost there!",
  
  // Playful and Humorous
  "Mixing ingredients... careful, it might explode (in a good way)!",
  "Hold tight—our AI alchemist is cooking up a surprise!",
  "Stirring the pot of imagination… don’t peek just yet!",
  "Combining objects is easy. Creating magic? That takes a moment.",
  "The pixels are negotiating. They’ll come to an agreement soon!",
  
  // Inspirational and Thought-Provoking
  "Every great invention starts with a moment of patience...",
  "Creativity takes time—you're about to witness something amazing!",
  "The art of mixing is like life itself—unpredictable and fascinating.",
  "Out of many, one shall arise... the wait is worth it!",
  "While you wait, imagine the infinite possibilities of creation.",
  
  // Thematic and Immersive
  "The forge of innovation glows bright... your artifact is being shaped.",
  "Wizards and engineers work tirelessly behind the scenes—get ready!",
  "The crafting table hums with energy... your creation is almost here.",
  "Ancient knowledge and futuristic technology combine... what’s next?",
  "The workshop is alive with sparks—soon, a masterpiece will emerge."
];


getCam();

//recognition button is pressed, set current recognition
recognitionButton.addEventListener("click", () => {
  // containObjectList.push([label, userName]);
  boxes.push(new ContainBox(label, currentImg));
  // document.getElementById("currentRecognition").innerHTML = containObjectList[containObjectList.length - 1];
  // console.log(containObjectList);
  updateTable();
});

//send button is pressed, send current recognition to socket
// sendButton.addEventListener("click", () => {
//   data = {
//     name: 'send recognition',
//     object: containObjectList,
//     username: userName,
//     partycode: partyCode
//   };
//   socket.emit("connection_name", data);
//   // console.log("containObjectList sent!");
//   containObjectList = [];
//   for (let i = 0; i < boxes.length; i++) {
//     boxes[i].remove();
//   }
//   boxes = [];
//   // updateTable();
// });

mixButton.addEventListener("click", () => {
  console.log("Mix button pressed!");
  mixing = true;
  loadingDiv.style.display = "block";
  //replace the loading text with a random message
  loadingText.innerHTML = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  if (!opennai_lock) {
    opennai_lock = true;
    let formattedPrompt = '';
    // let formattedPrompt = containObjectList.map(row => row[0]).join(", ");
    for (box of boxes) {
      formattedPrompt += box.name + ", ";
    }
    sendOpenAIRequest(`You are an advanced AI creator that helps users mix and combine objects to generate entirely new creations. Your goal is to blend the attributes, features, and functionality of the provided objects into a cohesive and imaginative new entity. Ensure the generated object is coherent, logical, and enriched with innovative features derived from the input objects. If the user specifies a theme, function, or environment, tailor the generated object accordingly. Be creative, but maintain practicality where necessary. Provide a brief description of the new object, its key features, and potential use cases.I will provide you several objects: ${formattedPrompt} Please use your imagination, what will be generate by mixing all these objects. You should reply with just a single word, and a three sentences detailed description to describe the object. Seperated by a semicolon. For example: "wingcar;A futuristic winged car soaring through a vibrant sky, its sleek aerodynamic body glistening in the sunlight. The car features large, gracefully curved wings resembling those of a bird, crafted from metallic materials with intricate feather-like details."`);
    // containObjectList = [['mixing...', userName]];
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].remove();
    }
    boxes = [];
    updateTable();
  }

});

//partycode is changed
// partycodeInput.addEventListener("change", () => {
//   console.log("Partycode changed!");
//   partyCode = partycodeInput.value;
// });

//username is changed
// usernameInput.addEventListener("change", () => {
//   console.log("Username changed!");
//   userName = usernameInput.value;
// });

layui.use(function () {
  var $ = layui.$;
  var layer = layui.layer;
  var util = layui.util;
  var form = layui.form;
  // 事件
  util.on('lay-on', {
    'image-generated': function () {
      layer.open({
        type: 1,
        shade: false,
        content: $('#image-container'),
        title: openai_result[0],
        offset: windowHeight / 2 - windowWidth * 3 / 4 + 'px',
        end: function () {
          testDataInvisible();
        }
      });
    }
  });
});

function setupFinished(){
  testDataInvisible();
}

function testDataInvisible() {
  //make testDataDiv z-index to -99
  testDataDiv.style.zIndex = '-99';
  testDataDiv.style.display = 'none';
}

function testDataVisible(){
  //make testDataDiv visible
  testDataDiv.style.zIndex = '1';
  testDataDiv.style.display = 'block';
}

function updateUserData() {
  //get username and partycode from url
  let urlUsername = urlParams.get('username');
  let urlPartyCode = urlParams.get('partycode');
  if (urlUsername.length > 0) {
    userName = urlUsername;
  }
  if (urlPartyCode.length > 0) {
    partyCode = urlPartyCode;
  }
}

//renger a layui table with the data in containObjectList
function updateTable() {
  //do nothing
  console.log("Updating table being called");
  // let formattedData = containObjectList.map(row => ({
  //   object: row[0],   // First value as 'object'
  //   username: row[1]  // Second value as 'username'
  // }));

  // layui.use('table', function () {
  //   var table = layui.table;
  //   table.render({
  //     elem: '#contain-table',
  //     cols: [[
  //       { field: 'object', title: 'Objects in Beaker' },
  //       { field: 'username', title: 'Experimenter' }
  //     ]],
  //     data: formattedData,
  //     // fixed: true,
  //     className: 'contain-table-sub',
  //     height: distance + 'px',
  //     page: false, // Disable pagination
  //     limit: Number.MAX_VALUE, // Show all data without pagination
  //   });
  // });
  // // Make the table scrollable
  // document.querySelector('.layui-table-body').style.overflowY = 'scroll';
}

async function getCam() {
  await navigator.mediaDevices.getUserMedia({ video: true });
  navigator.mediaDevices.enumerateDevices().then(devices => {
    devices.forEach(device => {
      if (device.kind === 'videoinput') {
        cameraDevices.push({ title: device.label || `Camera ${cameraDevices.length}`, id: device.deviceId });
      }
    });

    layui.use(['dropdown'], function () {
      var dropdown = layui.dropdown;
      dropdown.render({
        elem: '.cameraSelect',
        data: cameraDevices,
        click: function (data, othis, event) {
          this.elem.find('span').text(data.title);
          cameraChanged(data.id);
        },
      });
    });
  });
}
