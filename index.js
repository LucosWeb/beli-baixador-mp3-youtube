const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const downloadAndConvertAudio = async (url) => {
  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    console.log(`Baixando: ${title}`);

    const outputFileNameBase = title.replace(/[\/:*?"<>|]/g, '') + '.mp3';
    const outputDir = './musicas/';
    const outputPath = outputDir + outputFileNameBase;
    const convertedPath = outputPath.replace('.mp3', '-128k.mp3');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let fileNumber = 1;
    let outputFileName = outputFileNameBase;
    while (fs.existsSync(outputDir + outputFileName)) {
      outputFileName = outputFileNameBase.replace('.mp3', `-${fileNumber}.mp3`);
      fileNumber++;
    }

    const videoStream = ytdl(url, { quality: 'highestaudio' });
    const audioStream = fs.createWriteStream(outputDir + outputFileName);

    audioStream.on('finish', () => {
      console.log(`Download concluído, convertendo ${title} para 128 kbps...`);

      ffmpeg()
        .input(outputDir + outputFileName)
        .audioBitrate('128k')
        .save(convertedPath)
        .on('end', () => {
          fs.unlinkSync(outputDir + outputFileName);
          console.log(`Música ${title} baixada e convertida com sucesso!`);
          downloadMenu(); // Retorna ao menu após o download
        })
        .on('error', (err) => {
          console.error(`Erro na conversão de áudio de ${title}:`, err);
          downloadMenu(); // Retorna ao menu em caso de erro
        });
    });

    videoStream.pipe(audioStream);
  } catch (error) {
    console.error('Erro ao baixar o vídeo:', error.message);
    downloadMenu(); // Retorna ao menu em caso de erro
  }
};

const downloadMusicList = async (musicList) => {
  for (const url of musicList) {
    await downloadAndConvertAudio(url);
  }
};

const readMusicListFromFile = (filePath) => {
  try {
    const musicList = fs.readFileSync(filePath, 'utf-8').split('\n').filter(url => url.trim() !== '');
    return musicList;
  } catch (error) {
    console.error('Erro ao ler o arquivo de músicas:', error);
    rl.close();
  }
};

const downloadMenu = () => {
  console.log('\nEscolha uma opção:');
  console.log('1. Baixar música de uma URL');
  console.log('2. Baixar lista de músicas de um arquivo');
  console.log('3. Sair');

  rl.question('Opção: ', (choice) => {
    if (choice === '1') {
      rl.question('Digite a URL do vídeo do YouTube: ', (url) => {
        downloadAndConvertAudio(url);
      });
    } else if (choice === '2') {
      rl.question('Digite o caminho do arquivo de músicas (uma URL por linha): ', (filePath) => {
        const musicList = readMusicListFromFile(filePath);
        downloadMusicList(musicList);
      });
    } else if (choice === '3') {
      rl.close();
    } else {
      console.log('Opção inválida. Por favor, escolha 1, 2 ou 3.');
      downloadMenu(); // Retorna ao menu em caso de opção inválida
    }
  });
};

console.log('Bem-vindo ao baixador de músicas do YouTube.');
downloadMenu(); // Inicia o programa com o menu
