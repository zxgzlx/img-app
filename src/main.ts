import { fs, shell } from "@tauri-apps/api";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { writeText } from '@tauri-apps/api/clipboard';

interface CustomFile {
  dir: string;
  is_audio: boolean;
  is_img: true;
  name: string;
  path: string;
  size: number;
  mime: string;
}

interface Config {
  paths: string[];
}

async function readConfig() {
  let isExits = await fs.exists('config.json', { dir: fs.BaseDirectory.Resource });
  if (isExits) {
    let res = await fs.readTextFile('config.json',{ dir: fs.BaseDirectory.Resource });
    let config = JSON.parse(res) as Config;
    return config;
  }
  return null;
}

async function writeConfig(path: string[]) {
  await fs.writeTextFile('config.json', JSON.stringify({
    "paths": path
  }), { dir: fs.BaseDirectory.Resource });
}

await appWindow.onFileDropEvent((event) => {
  if (event.payload.type === 'hover') {
    console.log('User hovering', event.payload.paths);
  } else if (event.payload.type === 'drop') {
    console.log('User dropped', event.payload.paths);
    writeConfig(event.payload.paths);
    render(event.payload.paths);
  } else {
    console.log('File drop cancelled');
  }
});

let curPaths: string[] = [];
function render(paths: string[]) {
  curPaths = paths;
  console.log('paths:', paths);
  if (!paths) return;
  document.querySelector('.drag-img')?.remove();
  document.querySelector('.waterfall')?.remove();

  paths.forEach(async (path) => {
    console.log('File path:', path);
    let customFiles: CustomFile[] = await invoke('path_by_mime', { pathName: path });
    customFiles = customFiles.sort((a, b) => { return b.size - a.size});
    console.log(customFiles);

    const waterfall = document.createElement('div');
    document.body.appendChild(waterfall);
    waterfall.className = 'waterfall';

    customFiles.forEach(customFile => {
      if (customFile.mime === 'mp3' || customFile.mime === 'mp4') {
        console.log(customFile.mime);
        return;
      }
      console.log(customFile.size / 1024 / 1024);

      let size = '';
      if (customFile.size / 1024 / 1024 / 1024 > 1) {
        size = (customFile.size / 1024 / 1024).toFixed(2) + 'GB';
      } else if (customFile.size / 1024 / 1024 > 1) {
        size = (customFile.size / 1024 / 1024).toFixed(2) + 'MB';
      } else if (customFile.size / 1024 > 1) {
        size = (customFile.size / 1024).toFixed(2) + 'KB';
      } else {
        size = customFile.size.toFixed(2) + 'B';
      }
      let apiPath = convertFileSrc(customFile.path)

      const item = document.createElement('div');
      item.className = 'item';
      waterfall.appendChild(item);
      const img = document.createElement('img');
      img.src = apiPath;
      item.appendChild(img);
      // 给图片添加路径名称
      const text = document.createElement('div');
      text.className = 'img-path-name';
      text.textContent = customFile.path.substring(customFile.path.lastIndexOf('\\') + 1, customFile.path.lastIndexOf('.')) + '\n' + size;
      item.appendChild(text);

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        document.body.querySelector('.custom-menu')?.remove();
      });

      item.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        shell.open("file://" + customFile.path);
      });

      // 右键菜单
      img.oncontextmenu = function (e) {
        e.preventDefault();
        console.log(e);
        document.body.querySelector('.custom-menu')?.remove();
        const menu = document.createElement('div');
        menu.classList.add('custom-menu');
        const option1 = document.createElement('div');
        option1.textContent = '打开图片';
        option1.classList.add('menu-option');
        option1.setAttribute('value', customFile.path);

        const option2 = document.createElement('div');
        option2.textContent = '跳转目录';
        option2.classList.add('menu-option');
        // 截取文件路径的目录
        // option2.setAttribute('value', pathName.substring(0, pathName.lastIndexOf('\\')));
        option2.setAttribute('value', customFile.path);

        const option3 = document.createElement('div');
        option3.textContent = '取色器';
        option3.classList.add('menu-option');

        const option4 = document.createElement('div');
        option4.textContent = '刷新界面';
        option4.classList.add('menu-option');

        menu.appendChild(option1);
        menu.appendChild(option2);
        menu.appendChild(option3);
        menu.appendChild(option4);
        document.body.prepend(menu);

        option1.addEventListener('click', () => {
          // 点击选项1时执行操作
          e.stopPropagation();
          document.body.removeChild(menu);
          shell.open("file://" + option1.getAttribute('value'));
        });

        option2.addEventListener('click', (e) => {
          // 点击不传递点击事件
          e.stopPropagation();
          // 点击选项2时执行操作 
          document.body.removeChild(menu);
          invoke("cmd_explorer", { pathName: option2.getAttribute('value') });
        });

        option3.addEventListener('click', async (e) => {
          e.stopPropagation();
          document.body.removeChild(menu);
          // 调用系统的取色器
          // @ts-ignore
          const eyeDropper = new EyeDropper();
          const eyeDropperOpen = await eyeDropper.open();
          waterfall.style.backgroundColor = eyeDropperOpen.sRGBHex;
          await writeText(eyeDropperOpen.sRGBHex);
        });

        option4.addEventListener('click', async (e) => {
          e.stopPropagation();
          document.body.removeChild(menu);
          render(curPaths);
        });

        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
      }
    });
  })
}

document.addEventListener('click', (event) => {
  if (event.button === 0) {
    event.stopPropagation();
    document.body.querySelector('.custom-menu')?.remove();
  }
})

window.addEventListener("DOMContentLoaded", () => {

});

async function run() {
  let config = await readConfig();
  if (config) {
    render(config.paths);
  }
}

run();