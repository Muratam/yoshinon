const Vue = require('vue/dist/vue.min');
const $ = require('jquery');
const {ipcRenderer} = require('electron');

const planeVoice = {
  props: ['text'],
  template: `<div class="voice-innercontent">{{text}}</div>`,
};

const mediaVoice = {
  props: ['image', 'head', 'text'],
  template: `
      <div class="voice-innercontent">
        <a class="media-left">
          <img style="height:3em;opacity:0.7" alt="" :src="image">
        </a>
        <div class="media-body">
          <strong>{{head}}</strong>
          <div>{{text}}</div>
        </div>
      </div>`
};


const app = new Vue({
  el: '#app',
  template: `
      <div class="voice-wrapper">
        <div v-for="voice in voices">
          <plane v-if="! voice.image" :text="voice.text"></plane>
          <media v-if="voice.image" :image="voice.image" :head="voice.head" :text="voice.text"></media>
        </div>
      </div>`,
  data: {voices: [], allData: {}, showAll: false, currentChannel: ''},
  components: {plane: planeVoice, media: mediaVoice},
  methods: {
    parseContent(msg, media) {
      if (!media) {
        return ['plane', {text: msg}];
      } else {
        const {icon_url, channel, name, text} =
            typeof(msg) === 'string' ? JSON.parse(msg) : msg;
        return [
          channel, {image: icon_url, head: channel + ' ' + name, text: text}
        ];
      }
    },
    changeVoice(msg, media) {
      const [channel, content] = this.parseContent(msg, media);
      const updateContents = () => {
        this.allData[channel] = this.allData[channel] || [];
        this.allData[channel].unshift(content);
        this.currentChannel = channel;
        if (this.showAll) {
          this.voices = this.allData[channel];
        } else {
          this.voices = [content];
        }
      };
      $('html')
          .animate({opacity: 0}, 720, updateContents)
          .animate({opacity: 1}, 720);
    },
    changeShowAll(showAll) {
      this.showAll = showAll;
      if (this.showAll) {
        this.voices = this.allData[this.currentChannel];
      } else {
        this.voices = [this.allData[this.currentChannel][0]];
      }
    },
    updateChannelHistory(channel, hists) {
      hists = hists.map(h => this.parseContent(h, true)[1]);
      this.allData[channel] = hists;
    }
  }
});

ipcRenderer.on('voice', (evt, msg) => {app.changeVoice(msg, false)});
ipcRenderer.on('media-voice', (evt, msg) => {app.changeVoice(msg, true)});
ipcRenderer.on('focus', (evt, msg) => {app.changeShowAll(true)});
ipcRenderer.on('blur', (evt, msg) => {app.changeShowAll(false)});
ipcRenderer.on('update-channel-history', (evt, msg) => {
  const [channel, hists] = JSON.parse(msg);
  app.updateChannelHistory(channel, hists);
});
app.changeVoice(
    'ずいぶんと遅い目覚めでしてー、今日のよき日は始まっていますよー', false);
// ipcRenderer.on("hide", (evt, msg) => {
//   $("body").animate({ backgroundColor: "#FF0000" }, 500);
// });
// ipcRenderer.on("show", (evt, msg) => {
//   $("body").animate({ "background-color": "#FF0000" }, 500);
// });
