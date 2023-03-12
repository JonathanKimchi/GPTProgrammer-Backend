
const express = require('express');
const Docker = require('dockerode');

const app = express();
const docker = new Docker();

app.post('/dockerfile', async (req, res) => {
  const { dockerfile } = req.body;

  const container = await docker.createContainer({
    Image: 'node',
    Cmd: ['/bin/bash'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    OpenStdin: true,
    StdinOnce: true
  });

  await container.modem.demuxStream(container.attach({stream: true, stdin: true, stdout: true, stderr: true}), process.stdout, process.stderr);
  await container.exec({
    Cmd: ['echo', `${dockerfile}`, '>', '/Dockerfile'],
    AttachStdout: true,
    AttachStderr: true
  });
  await container.exec({
    Cmd: ['docker', 'build', '.'],
    AttachStdout: true,
    AttachStderr: true
  });

  res.status(200).send('Docker container created');
});

app.listen(3000, () => console.log('Server listening on port 3000!'));
