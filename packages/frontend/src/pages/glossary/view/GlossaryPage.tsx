import React from 'react'
import { FullPageHeader } from '../../../components/FullPageHeader'
import { PageContent } from '../../../components/PageContent'
import { ScrollToTopButton } from '../../../components/ScrollToTopButton'
import { DashboardLayout } from '../../../layouts/DashboardLayout'
import { GlossaryEntry } from '../props/getGlossaryEntry'
import { AlphabetSelector } from './AlphabetSelector'
import { GlossaryItem } from './GlossaryItem'
import { GlossarySideNavigation } from './GlossarySideNavigation'

export interface GlossaryPageProps {
  entries: GlossaryEntry[]
}

export function GlossaryPage(props: GlossaryPageProps) {
  return (
    <DashboardLayout>
      <FullPageHeader className="pb-0">
        <div className="w-full">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:justify-between">
            <h1 className="font-bold text-6xl">Glossary</h1>
            <div className="w-full text-lg lg:w-2/3">
              <p className="font-medium">
                Explore the L2BEAT Glossary, your comprehensive resource for
                understanding the terms and concepts of the L2 ecosystem. Find
                here all essential definitions and insights.
              </p>{' '}
              <p className="font-light">
                Designed for everyone from developers to enthusiasts, this
                resource simplifies the complexities of L2s, helping you
                navigate Ethereum's advanced landscape with ease.
              </p>
            </div>
          </div>
        </div>
      </FullPageHeader>
      <FullPageHeader
        className="sticky top-0 z-10 py-8 lg:pt-14"
        pageContentClassName="block"
        as="div"
      >
        <AlphabetSelector entries={props.entries} />
      </FullPageHeader>
      <PageContent className="mt-12 flex">
        <GlossarySideNavigation entries={props.entries} />
        <main className="lg:ml-16">
          {props.entries.map((entry) => (
            <GlossaryItem key={entry.id} entry={entry} />
          ))}
        </main>
      </PageContent>
      <ScrollToTopButton />
    </DashboardLayout>
  )
}
