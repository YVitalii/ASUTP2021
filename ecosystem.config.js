module.exports = {
  apps : [
    {
      name:"rs485server"
     ,script: 'npm'
     ,args: 'start'
     ,watch:'.'
     ,ignore_watch:['./public/logs',"node_modules"]
    }
  ]
};
