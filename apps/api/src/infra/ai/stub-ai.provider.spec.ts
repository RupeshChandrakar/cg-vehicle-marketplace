import { StubAiProvider } from './stub-ai.provider';

describe('StubAiProvider', () => {
  const provider = new StubAiProvider();

  it('grounds the draft in the real vehicle facts', async () => {
    const draft = await provider.suggestReply({
      vehicle: {
        title: 'Maruti Suzuki Swift VXI',
        brand: 'Maruti Suzuki',
        model: 'Swift VXI',
        year: 2020,
        price: 545000,
        kmDriven: 41000,
        fuelType: 'petrol',
        transmission: 'manual',
        specs: {},
      },
      messages: [],
    });

    expect(draft).toContain('Maruti Suzuki Swift VXI');
    expect(draft).toContain('5,45,000');
    expect(draft).toContain('41,000 km');
    expect(draft).toContain('petrol/manual');
  });

  it('quotes the last customer message when one exists', async () => {
    const draft = await provider.suggestReply({
      vehicle: {
        title: 'Tata 407 Gold',
        brand: 'Tata',
        model: '407 Gold',
        year: 2018,
        price: 725000,
        kmDriven: 98000,
        fuelType: 'diesel',
        transmission: 'manual',
        specs: {},
      },
      messages: [
        { senderType: 'customer', body: 'Kya price negotiable hai?' },
        { senderType: 'agent', body: 'Thoda kam ho sakta hai.' },
        { senderType: 'customer', body: 'Kab dekhne aa sakte hain?' },
      ],
    });

    expect(draft).toContain('Kab dekhne aa sakte hain?');
  });

  it('labels the output as a stub, never mistakable for real AI', async () => {
    const draft = await provider.suggestReply({
      vehicle: {
        title: 'Test Vehicle',
        brand: 'Test',
        model: 'Model',
        year: 2020,
        price: 100000,
        kmDriven: 1000,
        fuelType: 'petrol',
        transmission: 'manual',
        specs: {},
      },
      messages: [],
    });

    expect(draft).toContain('stub AI provider');
  });
});
