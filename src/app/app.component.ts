import { Component, OnInit } from '@angular/core';
import AgoraRTC from "agora-rtc-sdk-ng"


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'agora-call';
  isMuteAudio = false;
  statusMessages = [];
  callType: string;
  options =
    {
      // Pass your App ID here.
      appId: '5356c0dfd0a743b6b544a7683bc35f96',
      // Set the channel name.
      channel: '123',
      // Pass your temp token here.
      token: null,
      // Set the user ID.
      uid: Math.floor(Math.random() * 100),
    };
  channelParameters: any = {};
  agoraEngine: any;

  constructor() {
  }

  ngOnInit(): void {
    // Create an instance of the Agora Engine
    this.agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.startBasicCall();
  }

  async startBasicCall() {
    const remotePlayerContainer = document.createElement("div");
    // Dynamically create a container in the form of a DIV element to play the local video track.
    const localPlayerContainer = document.createElement('div');
    // Specify the ID of the DIV container. You can use the uid of the local user.
    localPlayerContainer.id = this.options.uid.toString();
    // Set the textContent property of the local video container to the local user id.
    localPlayerContainer.textContent = "Local user " + this.options.uid;
    // Set the local video container size.
    localPlayerContainer.style.width = "640px";
    localPlayerContainer.style.height = "480px";
    localPlayerContainer.style.padding = "15px 5px 5px 5px";
    // Set the remote video container size.
    remotePlayerContainer.style.width = "640px";
    remotePlayerContainer.style.height = "480px";
    remotePlayerContainer.style.padding = "15px 5px 5px 5px";
    AgoraRTC.onAutoplayFailed = () => {
      // Create button for the user interaction.
      const btn = document.createElement("button");
      // Set the button text.
      btn.innerText = "Click me to resume playback";
      // Remove the button when onClick event occurs.
      btn.onclick = () => {
        btn.remove();
      };
      // Append the button to the UI.
      document.body.append(btn);
    }
    // Set an event listener on the range slider.
    document.getElementById("localAudioVolume").addEventListener("change", (event) => {
      let that = this;
      console.log("Volume of local audio :" + (event.target as HTMLInputElement).value);
      // Set the local audio volume.
      that.channelParameters.localAudioTrack.setVolume(parseInt((event.target as HTMLInputElement).value));
    });
    // Set an event listener on the range slider.
    document.getElementById("remoteAudioVolume").addEventListener("change", (event) => {
      let that = this;

      console.log("Volume of remote audio :" + (event.target as HTMLInputElement).value);
      // Set the remote audio volume.
      that.channelParameters.remoteAudioTrack.setVolume(parseInt((event.target as HTMLInputElement).value));
    });


    // Listen for the "user-published" event to retrieve an AgoraRTCRemoteUser object.
    this.agoraEngine.on("user-published", async (user, mediaType) => {
      // Subscribe to the remote user when the SDK triggers the "user-published" event.
      await this.agoraEngine.subscribe(user, mediaType);
      console.log("subscribe success");
      console.log({ user });
      console.log({ mediaType });
      this.showMessage(`User with ${user.uid} is connected to the channel`)
      // Subscribe and play the remote audio track.
      if (mediaType == "audio") {
        this.callType = 'audio';
        this.channelParameters.remoteUid = user.uid;
        // Get the RemoteAudioTrack object from the AgoraRTCRemoteUser object.
        this.channelParameters.remoteAudioTrack = user.audioTrack;
        // Play the remote audio track.
        this.channelParameters.remoteAudioTrack.play();
        this.showMessage("Remote user connected: " + user.uid);
      } else if (mediaType == 'video') {
        this.callType = 'video';
        // Retrieve the remote video track.
        this.channelParameters.remoteVideoTrack = user.videoTrack;
        // Retrieve the remote audio track.
        this.channelParameters.remoteAudioTrack = user.audioTrack;
        // Save the remote user id for reuse.
        this.channelParameters.remoteUid = user.uid.toString();
        // Specify the ID of the DIV container. You can use the uid of the remote user.
        remotePlayerContainer.id = user.uid.toString();
        this.channelParameters.remoteUid = user.uid.toString();
        remotePlayerContainer.textContent = "Remote user " + user.uid.toString();
        // Append the remote container to the page body.
        document.body.append(remotePlayerContainer);
        // Play the remote video track.
        this.channelParameters.remoteVideoTrack.play(remotePlayerContainer);
      }

      // Listen for the "user-unpublished" event.
      this.agoraEngine.on("user-unpublished", user => {
        console.log(user.uid + "has left the channel");
        this.showMessage(`Remote user with uid ${user.uid} has left the channel`);
      });
    });
    window.onload = () => {
      let that = this;
      // For Audio calls
      // Listen to the Join button click event.
      document.getElementById("join").onclick = async () => {
        // Join a channel.
        await that.agoraEngine.join(that.options.appId, that.options.channel, that.options.token, that.options.uid);
        that.showMessage(`User with Id ${this.options.uid} joined channel -${that.options.channel}`);
        // Create a local audio track from the microphone audio.
        that.channelParameters.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        // Publish the local audio track in the channel.
        await that.agoraEngine.publish(that.channelParameters.localAudioTrack);
        console.log("Publish success!");
      }
      document.getElementById('muteAudio').onclick = async () => {
        let that = this;
        if (that.isMuteAudio == false) {
          // Mute the local audio.
          that.channelParameters.localAudioTrack.setEnabled(false);
          // Update the button text.
          document.getElementById(`muteAudio`).innerHTML = "Unmute Audio";
          that.isMuteAudio = true;
        }
        else {
          // Unmute the local audio.
          that.channelParameters.localAudioTrack.setEnabled(true);
          // Update the button text.
          document.getElementById(`muteAudio`).innerHTML = "Mute Audio";
          that.isMuteAudio = false;
        }
      }


      // Listen to the Leave button click event.
      document.getElementById('leave').onclick = async () => {
        // Destroy the local audio track.
        that.channelParameters.localAudioTrack.close();
        // Leave the channel
        await that.agoraEngine.leave();
        console.log("You left the channel");
        // Refresh the page for reuse
        window.location.reload();
      }

      // For video calls
        // Listen to the Join button click event.
        document.getElementById("join-video").onclick = async  ()=> {
          // Join a channel.
          await that.agoraEngine.join(that.options.appId, that.options.channel, that.options.token, that.options.uid);
          // Create a local audio track from the audio sampled by a microphone.
          that.channelParameters.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          // Create a local video track from the video captured by a camera.
          that.channelParameters.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          // Append the local video container to the page body.
          document.body.append(localPlayerContainer);
          // Publish the local audio and video tracks in the channel.
          await that.agoraEngine.publish([that.channelParameters.localAudioTrack, that.channelParameters.localVideoTrack]);
          // Play the local video track.
          that.channelParameters.localVideoTrack.play(localPlayerContainer);
          console.log("publish success!");
        }
        // Listen to the Leave button click event.
        document.getElementById('leave-video').onclick = async  () => {
          // Destroy the local audio and video tracks.
          that.channelParameters.localAudioTrack.close();
          that.channelParameters.localVideoTrack.close();
          // Remove the containers you created for the local video and remote video.
          that.removeVideoDiv(remotePlayerContainer.id);
          that.removeVideoDiv(localPlayerContainer.id);
          // Leave the channel
          await that.agoraEngine.leave();
          console.log("You left the channel");
          // Refresh the page for reuse
          window.location.reload();

      }
    }

  }

  // Remove the video stream from the container.
  removeVideoDiv(elementId) {
    console.log("Removing " + elementId + "Div");
    let Div = document.getElementById(elementId);
    if (Div) {
      Div.remove();
    }
  };

  showMessage(text) {
    this.statusMessages.push(text);
    // document.getElementById("message").textContent = text;
  }


}
