export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  image_url: string;
  buy_url: string;
  /**
   * Extra chat commands for this product, without the leading `!`.
   *
   * Every product is always reachable by its id and by its
   * whitespace-stripped name. These are for shorter aliases the team actually
   * says on stream — `!shampoo` rather than
   * `!neverthirstymoisturizingshampoo`.
   */
  commands?: string[];
}
