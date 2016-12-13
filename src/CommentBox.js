import React from 'react';
import ReactTooltip from 'react-tooltip'

import $ from 'jquery';

var TextContainer = React.createClass({
  render: function() {
    return (
            <div>
            <Aud url="/api/audio/97" />
        <TextBox url="/api/text/97" posturl="/api/post" />
        </div>
    );
  }
});

var Aud = React.createClass({
  getInitialState: function() {
    return {data: "https://catplanet.cat/line/mbmbam97slice.mp3"};
  },
  render: function() {
    return (
         <div>
           <audio controls id="mbmbam">
             <source src={this.state.data} type="audio/mpeg" />
           </audio>
         </div>
     );
  }
});

/*global $*/
var TextBox = React.createClass({
  loadTextFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        let dict = {}
        data.forEach(function(word, idx) {
            //let time = word.time;
            //let arr = time.split(":");
            //let ms = parseInt(arr[0])*3600 + parseInt(arr[1])*60 + parseFloat(arr[2]);
            dict[idx] = word[1];
        });
        let out = [];
        data.forEach(function(elm, idx) {
            let obj = new Object();
            obj.text = elm[0];
            obj.timestamp = elm[1];
            obj.position = elm[2];
            obj.speaker = "";
            out.push(obj);
        });
        console.log(out);
        console.log(dict);
        this.setState({data: out});
        this.setState({stamps: dict});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  sendSpeakerUpdatesToServer: function() {
    $.ajax({
      url: this.props.posturl,
      dataType: 'json',
      contentType: 'application/json',
      cache: false,
      method: "POST",
      data: JSON.stringify(this.state.data),
      success: function() {
          console.log("sent info to server");
      },
      error: function(xhr, status, err) {
        console.error(this.props.posturl, status, err.toString());
      }.bind(this) 
    });
  },
  setSpeaker: function(who) {
    this.state.selected.forEach(function(id) {
      this.state.data[id].speaker = who;
    }.bind(this));
    console.log(this.state.data);
    this.sendSpeakerUpdatesToServer();
    this.setState({selected: []});
  },
  setTime: function(index) {
      if(index < 0) {index = 0;}
      if(index > this.state.data.length) {index = this.state.data.length;}
      this.state.audio.currentTime = this.state.stamps[index];
  },
  onKeyPress(key){
      if(!this.state.tooltip){
        key.preventDefault();
        console.log(key.code);
        if(key.code == "KeyH"){
          if(this.state.selecting) {
            if(this.state.selected) {
              this.setTime(this.state.selected.pop()-1);
            }
          } else {
            this.setTime(this.state.hilight-1);
          }
        }
        if(key.code == "KeyL"){
          if(this.state.selecting) {
            let id = this.state.selected.length ? this.state.selected[this.state.selected.length-1] + 1 : this.state.hilight;
            this.state.selected.push(id);
            this.setTime(id);
          } else {
            this.setTime(this.state.hilight+1);
          }
        }
        if(key.code == "Space"){
          if(this.state.audio.paused){
              this.state.audio.play();
          } else {
              this.state.audio.pause();
          }
        }
        if(key.code == "KeyG"){
          this.setSpeaker("Griffin");
        }
        if(key.code == "KeyJ"){
          this.setSpeaker("Justin");
        }
        if(key.code == "KeyT"){
          this.setSpeaker("Travis");
        }
        if(key.code == "KeyE"){
          this.setState({tooltip: true});
          $("#text_box").focus();
        }
      } 
  },
  onKeyDown(key) {
    if(key.key == "Shift") {
        this.state.audio.pause();
        this.setState({selecting: true});
    } else {
      if(key.key == "Escape"){
        this.setState({tooltip: false})
      }
    }
  },
  onKeyUp(key) {
    if(key.key == "Shift") {
        this.setState({selecting: false});
    }
  },
  formSubmit(id, word) {
    let temp = this.state.data;
    temp[id].text = word;
    this.setState({data: temp});
    this.setState({tooltip: false});
    //sendSpeakerUpdatesToServer();
  },
  componentWillMount: function(){
      document.addEventListener("keypress", this.onKeyPress, false);
      document.addEventListener("keydown", this.onKeyDown, false);
      document.addEventListener("keyup", this.onKeyUp, false);
  },
  getHilight: function() {
      let time = this.state.audio.currentTime;
      let len = this.state.data.length;
      let word = 0;
      for(let i=this.state.start;i<len;i++) {
          if(this.state.stamps[i]-0.00001<=time){
              word = i;
          } else {break;}
      }
      if(word) {
          this.setState({start: word});
          this.setState({hilight : word});
      } else {
          this.setState({start: 0});
      }
      requestAnimationFrame(this.getHilight);
  },
  getInitialState: function() {
    let aud = document.getElementById("mbmbam");
    return {data: [], stamps: {}, episode: "97", hilight: 0, start: 0, selected: [], selecting: false, audio: aud, tooltip: false};
  },
  componentDidMount: function() {
    this.loadTextFromServer(); let aud = document.getElementById("mbmbam");
    this.setState({ audio: aud});
    this.setState({
        hilight: requestAnimationFrame(this.getHilight)
    });
    //setInterval(this.loadTextFromServer, this.props.pollInterval);
  },
  handleChangeEpisode: function(ep) {
    this.setState({episode: ep});
  },
  render: function() {
    let style = {display: "inline"}
    return (
      <span style={style} className="">
        <h1>Text</h1>
        <WordList data={this.state.data} formCB={this.formSubmit} tooltip={this.state.tooltip} selected={this.state.selected} hilight={this.state.hilight}/>
      </span>
    );
  }
});

var Word = React.createClass({
  callback: function(e) {
      e.preventDefault();
      this.props.formCB(this.props.position, this.state.value);
  },
  handleChange: function(e) {
      this.setState({value: e.target.value});
      $(this.refs.foo).trigger('mousemove', {type: 'custom mouse move'});
  },
  handleState: function(val) {
      this.setState({value: val});
  },
  getInitialState: function() {
    return {value: "", tt: null};
  },
  componentWillReceiveProps: function(nextProps) {
      if (nextProps.tooltip && this.props.position === this.props.hilight && !this.state.tt) {
          let tooltip = <ReactTooltip id={this.props.position} place="top" effect="solid"> <form onSubmit={this.callback}><ReInput cb={this.handleState} /></form> </ReactTooltip>; 
          this.setState({tt: tooltip}, this.showTT);
      }
      if (!nextProps.tooltip && this.state.tt) {
          this.setState({tt: null});
      }
  },
  showTT: function() {
    ReactTooltip.show(this.refs.foo);
    console.log("showing tooltip");
  },
  render: function() {
    let style;
    let pointer = {pointerEvents: "auto"};
    if(this.props.position === this.props.hilight){
        style = {color: "magenta"};
    } else if (this.props.selected && this.props.selected.indexOf(this.props.position) > -1) {
        style = {color: "blue"};
    } else if (this.props.speaker === "Griffin") {
        style = {color: "green"};
    } else if (this.props.speaker === "Justin") {
        style = {color: "orange"};
    } else if (this.props.speaker === "Travis") {
        style = {color: "yellow"};
    } else {
        style = {color: "black"};
    }
    let inline = {display: "inline"};
    return (
     <div style={inline}>
      <a style={style} id={this.props.position} ref='foo' data-tip  data-for={this.props.position}>
          {this.props.text} { " " }
      </a>
      {this.state.tt}
      </div>
    );
  }
});

var ReInput = React.createClass({
  handleChange: function(e) {
      this.setState({value: e.target.value});
      this.props.cb(e.target.value);
  },
  getInitialState: function() {
    return {value: ""};
  },
  componentDidMount: function() {
      this.refs.inp.focus();
      console.log("YES");
      console.log(this.refs.inp);
  },
  render: function() {
    return (
        <input id="text_box" type="text" ref="inp" value={this.state.value} onChange={this.handleChange} />
    );
   }
});

var WordList = React.createClass({
  render: function() {
    var wordNodes = this.props.data.map((word) => {
      return (
        <Word position={word.position} text={word.text} tooltip={this.props.tooltip} formCB={this.props.formCB} selected={this.props.selected} speaker={word.speaker} hilight={this.props.hilight}>
        </Word>
      );
    });
    let style = {display: "inline"};
    return (
      <div style={style} className="wordList" class="entries">
        {wordNodes}
      </div>
    );
  }
});

export default TextContainer
