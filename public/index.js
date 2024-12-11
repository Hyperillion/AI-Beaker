//get all camera devices
let cameraDevices = [];
let containObjectList = [];

const goButton = document.getElementById("go-button");
const usernameInput = document.getElementById("username");
const partycodeInput = document.getElementById("partycode");

getCam();

//recognition button is pressed, set current recognition
goButton.addEventListener("click", () => {
  //jump to beaker page with username and partycode
  window.location.href = `/beaker?username=${usernameInput.value}&partycode=${partycodeInput.value}`;
});

//partycode is changed
partycodeInput.addEventListener("change", () => {
  console.log("Partycode changed!");
  partyCode = partycodeInput.value;
});

//username is changed
usernameInput.addEventListener("change", () => {
  console.log("Username changed!");
  userName = usernameInput.value;
});

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
