const yo = require('yo-yo');

class ExperimentUI extends UIPlugin {
  constructor(elem, focusTracker){
    super(elem, focusTracker, "Experiment UI");
    this.microdrop = new MicrodropAsync();
    this.model = new Backbone.Model();
    this.render();
  }

  // ** Event Listeners **
  listen() {
    // State Routes (Ties to Data Controllers used by plugin):
    this.onStateMsg("protocol-model", "protocol-skeleton", this.onProtocolUpdated.bind(this));
    this.onStateMsg("protocol-model", "protocol-skeletons", this.onProtocolsUpdated.bind(this));
    // this.onTriggerMsg("send-protocol", this.onReceivedProtocol.bind(this));

    this.bindTriggerMsg("protocol-model", "new-protocol", "new-protocol");
    this.bindTriggerMsg("protocol-model", "save-protocol", "save");
    this.bindTriggerMsg("protocol-model", "change-protocol", "change-protocol");
    this.bindTriggerMsg("protocol-model", "delete-protocol", "delete-protocol");
    this.bindTriggerMsg("protocol-model", "upload-protocol", "upload-protocol");
    this.bindTriggerMsg("protocol-model", "request-protocol-export", "request-protocol-export");

    this.model.on("change", this.render.bind(this));
    this.on("item-clicked", this.onItemClicked.bind(this));
    this.on("delete", this.onDelete.bind(this));
  }
  download(str) {
    const anchor = D('<a style="display:none"></a>');
    const data = "data:text/json;charset=utf-8," + encodeURIComponent(str);
    anchor.setAttribute("href", data);
    anchor.setAttribute("download", `protocol_${Date.now()}.protocol.json`);
    anchor.click();
  }
  readFile(input) {
    const file   = input.el.files[0];
    const reader = new FileReader();
    reader.onload = this.onFileUploaded.bind(this);
    reader.readAsText(file);
  }
  upload() {
    const input = D('<input type="file" name="name" style="display: none;" />');
    input.on("change", () => this.readFile(input));
    input.click();
  }
  wrapData(key, value) {
    const msg = new Object();
    msg.__head__ = this.DefaultHeader();
    msg[key] = value;
    return msg;
  }

  // ** Getters and Setters **
  get name() { return "experiment-ui"}

  get protocols() {
    return this._protocols;
  }

  set protocols(protocols) {
    this._protocols = protocols;
    if (!this.protocol)
      this.trigger("change-protocol",
                   this.wrapData("name", _.last(this._protocols).name));
    this.list = this.List(this._protocols);
  }

  get protocol() {
    return this._protocol;
  }

  set protocol(protocol) {
    this._protocol = protocol;
    if (!this.protocols) {
      console.error("Tried setting protocol, but protocols was undefined");
      return;
    }
    this.list = this.List(this.protocols);
  }

  get list() {
    return this._list;
  }

  set list(list) {
    const prevList = this._list;

    // Set
    this._list = list;
    if (list) return;

    // Delete
    const node = prevList.el;
    this.element.removeChild(node);
    this._list = undefined;
    return;
  }

  get style() {
    const style = new Object();
    const border = "1px solid black";
    const highlight = "rgb(34, 80, 155)";
    style.ul = {"list-style": "none", padding: 0};
    style.li_inactive = {border: border};
    style.li_active = {border: border, background: highlight, color: "white"};
    return style;
  }

  get time() {
    return new Date(new Date().getTime()).toLocaleString();
  }

  // ** Event Handlers **
  onDelete(){
    this.trigger("delete-protocol", this.wrapData("protocol", this.protocol));
    // this.protocol = undefined;
  }
  onDuplicate(msg){
    const name = "Protocol: " + this.time;
    this.trigger("save", this.wrapData("name", name));
  }
  onExport(msg) {
    console.log("REQUESTING ExPORT!!");
    this.trigger("request-protocol-export", this.wrapData("body", null));
  }
  onImport(msg) {
    this.upload();
  }
  onFileUploaded(msg) {
    const protocol = JSON.parse(msg.target.result);
    protocol.name = "Protocol: " + this.time;
    this.trigger("upload-protocol", this.wrapData("protocol", protocol));
  }
  onProtocolsUpdated(msg) {
    // this.protocols = JSON.parse(msg);
    this.model.set("protocols", JSON.parse(msg));
  }
  onItemClicked(protocol) {
    this.microdrop.protocol.changeProtocol(protocol.name);
  }
  onNew() {
    this.trigger("new-protocol",
                 this.wrapData("body",null));
  }
  onProtocolUpdated(msg){
    this.model.set("protocol", JSON.parse(msg));
  }
  onReceivedProtocol(msg) {
    const str = msg;
    this.download(str);
  }
  onSave(msg){
    this.trigger("save", this.wrapData("name", this.protocol.name));
  }

  render() {
    let active;
    let protocols = [];
    let protocol  = {};
    if (this.model.has("protocols")) protocols = this.model.get("protocols");
    if (this.model.has("protocol")) protocol = this.model.get("protocol");

    console.log("protocols:::", protocols);
    const node = yo`
      <div>
        <div>
          <button type="button" onclick=${this.onNew.bind(this)}>New</button>
          <button type="button" onclick=${this.onSave.bind(this)}>Save</button>
          <button type="button" onclick=${this.onDuplicate.bind(this)}>Duplicate</button>
          <button type="button" onclick=${this.onExport.bind(this)}>Export</button>
          <button type="button" onclick=${this.onImport.bind(this)}>Import</button>
        </div>
        <ul class="list-group">
          ${protocols.map((p) =>{
            let cls;
            if (p.name == protocol.name) {cls = "active"};
            const clickMethod = () => {this.trigger("item-clicked", p)};
            return yo`
              <li class="list-group-item ${cls||''}"
                  style="padding:1px" onclick=${clickMethod.bind(this)}>
                ${p.name}
              </li>`;
          })}
        </ul>
      </div>
    `;
    this.element.innerHTML = "";
    this.element.appendChild(node);
    console.log("NODE:::", node);
    return;
  }

  // ** Static Methods **
  static position() {
    /* topLeft, topRight, bottomLeft, or bottomRight */
    return "topRight";
  }
}
module.exports = ExperimentUI;
