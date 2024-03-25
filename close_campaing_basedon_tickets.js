const axios = require('axios');

exports.main = async (event, callback) => {
  const hapikey = process.env.chavetickets;
  const campanhaId = event.inputFields['campanhaId'];
  const ticketProperties = ['hs_pipeline_stage'];
  
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.hubapi.com/crm/v3/objects/2-21453586/${campanhaId}?archived=false&associations=tickets&properties=${ticketProperties}`,
      headers: {
        'Authorization': `Bearer ${hapikey}`,
        'Content-Type': 'application/json'
      }
    });

    const tickets = response.data.associations.tickets.results;
    const ticketIds = tickets.map(ticket => ticket.id);

    const ticketResponses = await Promise.all(ticketIds.map(async ticketId => {
      const ticketResponse = await axios({
        method: 'GET',
        url: `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=${ticketProperties}`,
        headers: {
          'Authorization': `Bearer ${hapikey}`,
          'Content-Type': 'application/json'
        }
      });
      return ticketResponse.data;
    }));

    // Verifica se todos os tickets têm um dos estágios especificados
    const allTicketsMatch = ticketResponses.every(ticket => {
      const stageId = ticket.properties && ticket.properties.hs_pipeline_stage;
      return stageId === '138214050' || stageId === '138244752' || stageId === '138192247';
    });

    let tickets_concluidos_ = false;

    // Define o campanhaStage com base na verificação anterior
    if (allTicketsMatch) {
      tickets_concluidos_ = true;
    }

    console.log('tickets_concluidos_:', tickets_concluidos_);
    console.log('Status:', response.status);

   const outputFields = { // Definindo outputFields antes de passá-lo para callback
      status: response.status,
      tickets_concluidos_: tickets_concluidos_
    };

    callback({
      outputFields: outputFields
    });
  } catch (error) {
    console.error(`Error while getting contact`, error.message);
    callback({ error: error.message });
  }
};