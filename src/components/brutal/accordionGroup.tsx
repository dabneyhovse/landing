import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";

export default function AccordionGroup() {
  return (
    <div className="flex flex-col gap-8">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Our House</AccordionTrigger>
          <AccordionContent>
            Here, you can usually find people doing sets in the gazebo or
            library and hanging out in the lounge, talking or screening movies.
            We have a massive collection of board games to play, and a large
            pile of squashy objects in the lounge, called the bear pit. We just
            finished a new mural in the house, many darbs (as Dabney members are
            known) are artistically or musically inclined.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-2">
          <AccordionTrigger>Our Activities</AccordionTrigger>
          <AccordionContent>
            Here at Dabney, our family of eccentric Darbs have cultivated a
            space that makes all of us feel at home. You have any crazy ideas,
            like driving up a mountain to bring back snow to Dabney's courtyard?
            Or racing your friends across campus in wheeled trash can-based "hot
            tubs"? Or barricading the house against invading zombies (members of
            Venerable)? If you get enough support, we'll probably turn it into
            one of our weekly social events!
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-3">
          <AccordionTrigger>Our Special Events</AccordionTrigger>
          <AccordionContent>
            We hold some other large events, including the Pumpkin Drop, where
            we drop LN2 frozen pumpkins from the roof of the Caltech Hall to the
            sound of the 1812 Overture, our yearly Interhouse (a themed party),
            and the house retreat! In addition to these
            large events we also plan smaller weekly social events at the start
            of each new term.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
