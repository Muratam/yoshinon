const Vue = require('vue/dist/vue.min');
const $ = require('jquery');
const {ipcRenderer} = require('electron');

const planeVoice = {
  props: ['text'],
  template: `<div>{{text}}</div>`,
};

const mediaVoice = {
  props: ['image', 'head', 'text'],
  template: `
      <div class="media">
        <a class="media-left">
          <img style="height:3em;opacity:0.7" alt="" :src="image">
        </a>
        <div class="media-body">
          <strong>{{head}}</strong>
          <div class="voice">{{text}}</div>
        </div>
      </div>`
};


const app = new Vue({
  el: '#app',
  template: `
      <div style="line-height:1.2;background-color:rgba(80%, 90%, 80%,0.8)">
        <div v-for="voice in voices">
          <plane v-if="! voice.image" :text="voice.text"></plane>
          <media v-if="voice.image" :image="voice.image" :head="voice.head" :text="voice.text"></media>
          <hr>
        </div>
      </div>`,
  data: {voices: [], allData: {}},
  components: {plane: planeVoice, media: mediaVoice},
  methods: {
    parseContent(msg, media) {
      if (!media) {
        return ['plane', {text: msg}];
      } else {
        const {icon_url, channel, name, text} = JSON.parse(msg);
        return [
          channel, {image: icon_url, head: channel + ' ' + name, text: text}
        ];
      }
    },
    changeVoice(msg, media) {
      const [channel, content] = this.parseContent(msg, media);
      this.allData[channel] = this.allData[channel] || [];
      this.allData[channel].unshift(content);
      const updateContents = () => {
        this.voices = this.allData[channel];  //[content];
      };
      $('html')
          .animate({opacity: 0}, 720, updateContents)
          .animate({opacity: 1}, 720);
    },
  }
});

ipcRenderer.on('voice', (evt, msg) => {app.changeVoice(msg, false)});
ipcRenderer.on('media-voice', (evt, msg) => {app.changeVoice(msg, true)});
app.changeVoice(
    'ずいぶんと遅い目覚めでしてー、今日のよき日は始まっていますよー', false);
// ipcRenderer.on("hide", (evt, msg) => {
//   $("body").animate({ backgroundColor: "#FF0000" }, 500);
// });
// ipcRenderer.on("show", (evt, msg) => {
//   $("body").animate({ "background-color": "#FF0000" }, 500);
// });
