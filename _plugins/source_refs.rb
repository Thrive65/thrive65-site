# frozen_string_literal: true
#
# source_refs.rb — turn bare `[n]` citation markers into real anchors.
#
# WHY A PLUGIN. Source markers arrive in classless published markdown (Google
# Docs → _posts / page .md / _data/faq.yml), so they can't carry classes and we
# can't rewrite them at publish time without baking HTML into the Doc export.
# Doing it in client-side JS would break the no-JS requirement outright. A
# build-time rewrite is the only place that satisfies both.
#
# NOTE: this is the repo's first `_plugins/` file. CI runs `bundle exec jekyll
# build` (Jekyll 4.3, *not* the `github-pages` gem), so custom plugins run. This
# permanently forecloses moving back to that gem — already effectively true.
#
# WHAT IT EMITS
#   [3]        →  <sup class="source-ref-group"><a class="chip source-ref" …>3</a></sup>
#   [4][7]     →  one <sup class="source-ref-group"> holding both anchors
#   [x](#source-3) → <a class="source-ref source-ref-inline" …>x</a>   (no <sup>)
#   *Sources: [1][2]*  →  <p class="source-rollup">…</p>
#
# The <sup class="source-ref-group"> wrapper is load-bearing: it is how the
# source panel finds every marker in a run (`a.closest(".source-ref-group")`)
# without any sibling-walking heuristic.
#
# ENTRY POINTS
#   1. :pre_render hook — whole-file markdown surfaces that set `sources: <key>`
#      in front matter (or via _config.yml `defaults`).
#   2. Liquid filter `source_refs` — _data-driven content (the FAQ), where each
#      answer is rewritten with its section pinned to the accordion item.

require "jekyll"

module Thrive65
  module SourceRefs
    # Opening/closing fence of a fenced code block.
    FENCE = /\A\s{0,3}(`{3,}|~{3,})/.freeze

    # Inline spans that must never be rewritten. The link alternative allows one
    # nested bracket pair so it swallows the `[[link]](url)` shape used
    # throughout the existing source lists, and one nested paren pair so URLs
    # containing parens survive.
    #
    # Reference-style links (`[text][1]`) are deliberately NOT masked here: the
    # pattern is indistinguishable from a marker run like `[4][7]`, which is far
    # more common in this content. RUN's `(?<![\\\]])` lookbehind is what rejects
    # them instead — it only ever matches all-digit brackets, and a real
    # reference link's label bracket is always preceded by the text bracket's `]`.
    MASK = %r{
      (
        `[^`\n]*`
      | !?\[(?:[^\[\]]|\[[^\[\]]*\])*\]\((?:[^()]|\([^()]*\))*\)
      | </?[A-Za-z][^>]*>
      )
    }x.freeze

    # An author-written link whose target is a source anchor on this same page.
    # $1 = link text, $2 = everything before the `#`, $3 = the number.
    ANCHOR = %r{
      \A!?\[((?:[^\[\]]|\[[^\[\]]*\])*)\]\(\s*([^)\#]*)\#source-(\d{1,3})\s*\)\z
    }x.freeze

    # A run of one or more bare markers. The lookbehind rejects reference-style
    # links (`[foo][1]`) and escaped brackets; the lookahead rejects real inline
    # links (`[text](url)`); {1,3} stops a bracketed year or dollar amount from
    # being swallowed.
    RUN = /(?<![\\\]])((?:\[\d{1,3}\])+)(?!\()/.freeze

    # The FAQ's trailing roll-up line, e.g. `*Sources: [1][2][39]*`.
    ROLLUP = /\A\s*\*Sources:\s*((?:\[\d{1,3}\])+)\*\s*\z/.freeze

    # A kramdown link-reference definition (`[1]: https://…`) — never a marker.
    LINK_DEF = /\A\s{0,3}\[\d{1,3}\]:\s/.freeze

    HEADING = /\A(\#{1,6})\s+(.+?)\s*\#*\s*\z/.freeze

    # ---------------------------------------------------------------------- #
    # Context — accumulates back-links while a document is rewritten.
    #
    # Back-links dedupe by section: a source cited five times in one section
    # yields one back-link (to the first citation); cited across three sections,
    # three. The FAQ roll-up rule ("only if not already cited inline in the same
    # answer") falls out of that dedupe for free — the inline markers register
    # first, so the roll-up's registration is deduped away.
    # ---------------------------------------------------------------------- #
    class Context
      attr_reader :citations

      # section: nil          → scanning mode, sections come from ## headings
      # section: {id:, label:} → pinned mode (FAQ), every citation belongs to it
      def initialize(section: nil, fallback_label: nil)
        @pinned = !section.nil?
        @section = section
        @fallback_label = fallback_label
        @citations = {}
        @counters = Hash.new(0)
        @used_ids = {}
        @seen = {}
      end

      def section=(sec)
        @section = sec unless @pinned
      end

      # Pinned mode only: point the context at the item about to be rendered.
      def pin(sec)
        @section = sec
      end

      # Returns the id to stamp on this marker. Registers a back-link the first
      # time this source is cited in this section.
      def register(num)
        key = num.to_s
        @seen[key] = true
        cite_id = "cite-#{num}-#{@counters[key] += 1}"

        sec_id   = @section ? @section["id"] : nil
        sec_label = @section ? @section["label"] : @fallback_label
        # Citations before the first heading share one synthetic section so they
        # collapse to a single back-link rather than one per marker.
        sec_id ||= "__top"

        list = (@citations[key] ||= [])
        unless list.any? { |c| c["section_id"] == sec_id }
          # In pinned (FAQ) mode the back-link targets the accordion item, which
          # works with JS off; the precise cite id is inside a closed <details>.
          href = @pinned ? "##{sec_id}" : "##{cite_id}"
          list << {
            "cite_id"    => cite_id,
            "section_id" => sec_id,
            "label"      => sec_label,
            "href"       => href,
          }
        end
        cite_id
      end

      def cited?(num)
        @seen.key?(num.to_s)
      end

      # Mirror kramdown's Converter::Base#generate_id so back-links land on the
      # ids kramdown actually emits. It operates on the *raw* header text (markup
      # included) and simply deletes everything outside [a-zA-Z0-9 -].
      def heading_id(raw_text)
        gen = raw_text.gsub(/\A[^a-zA-Z]+/, "")
        gen = gen.delete("^a-zA-Z0-9 -")
        gen = gen.tr(" ", "-").downcase
        gen = "section" if gen.empty?
        if @used_ids.key?(gen)
          "#{gen}-#{@used_ids[gen] += 1}"
        else
          @used_ids[gen] = 0
          gen
        end
      end
    end

    class << self
      # text      – markdown to rewrite
      # count     – number of entries in the source set (for validation)
      # ctx       – a Context
      # path      – for error messages
      # page_url  – this page's URL, so absolute self-links resolve (Google Docs
      #             can only author absolute links)
      def rewrite(text, count, ctx, path, page_url = nil)
        in_fence = false
        fence = nil
        out = []

        text.to_s.each_line.with_index do |line, idx|
          body = line.chomp
          lineno = idx + 1

          if (m = FENCE.match(body))
            if in_fence
              in_fence = false if body.lstrip.start_with?(fence)
            else
              in_fence = true
              fence = m[1][0, 3]
            end
            out << line
            next
          end
          if in_fence || LINK_DEF.match?(body)
            out << line
            next
          end

          if (h = HEADING.match(body))
            raw = h[2]
            ctx.section = { "id" => ctx.heading_id(raw), "label" => plain_text(raw) }
            out << line
            next
          end

          if (r = ROLLUP.match(body))
            out << rollup_html(r[1], ctx, count, path, lineno) << "\n"
            next
          end

          out << transform_line(line, ctx, count, path, lineno, page_url)
        end

        out.join
      end

      # Rewrites one whole-file markdown surface in place and publishes the
      # back-link map for _includes/source-backlinks.html.
      def rewrite_page(doc, site, payload = nil)
        key = doc.data["sources"]
        return unless key

        items = source_items(site, key, doc.relative_path)
        ctx = Context.new(fallback_label: doc.data["title"])
        doc.content = rewrite(doc.content, items.length, ctx,
                              doc.relative_path, doc.url)
        doc.data["source_citations"] = ctx.citations

        # Jekyll::Convertible#to_liquid snapshots `data` into a plain Hash, and
        # Page#render does that *before* :pre_render fires — so writing to
        # doc.data alone is invisible to the layout. Patch the live payload too.
        # (Documents get a lazy DocumentDrop instead, which reads doc.data, so
        # the guard below simply skips them.)
        pg = payload && payload["page"]
        pg["source_citations"] = ctx.citations if pg.is_a?(Hash)

        (1..items.length).each do |n|
          next if ctx.cited?(n)
          Jekyll.logger.warn "SourceRefs:",
                             "#{doc.relative_path}: source #{n} (#{items[n - 1]["title"]}) is never cited."
        end
      end

      def source_items(site, key, path)
        set = (site.data["sources"] || {})[key.to_s]
        unless set && set["items"].is_a?(Array)
          raise Jekyll::Errors::FatalException,
                "SourceRefs: #{path} sets `sources: #{key}` but _data/sources/#{key}.yml " \
                "is missing or has no `items:` list."
        end
        set["items"]
      end

      private

      def transform_line(line, ctx, count, path, lineno, page_url)
        # split() with a single capturing group yields alternating
        # [safe, masked, safe, masked, …] segments.
        line.split(MASK).each_with_index.map do |seg, i|
          if i.odd?
            anchor_html(seg, ctx, count, path, lineno, page_url) || seg
          else
            seg.gsub(RUN) do
              marker_run_html(Regexp.last_match(1), ctx, count, path, lineno)
            end
          end
        end.join
      end

      # `[the FY27 memo](#source-3)` — the convergence path. Produces the same
      # anchor contract as a bare marker (so the panel treats it identically) but
      # keeps the author's link text and skips the <sup>, because superscripting
      # a phrase mid-sentence would be wrong.
      def anchor_html(seg, ctx, count, path, lineno, page_url)
        m = ANCHOR.match(seg)
        return nil unless m
        return nil unless self_link?(m[2], page_url)

        num = m[3].to_i
        validate!(num, count, path, lineno)
        cite_id = ctx.register(num)
        %(<a class="source-ref source-ref-inline" href="#source-#{num}" ) +
          %(id="#{cite_id}" data-source="#{num}" role="doc-noteref">#{m[1]}</a>)
      end

      # The part before `#source-N` must be empty (a relative anchor) or this
      # page's own URL. Google Docs cannot author a relative link, so it exports
      # `https://wethrive65.org/some-page/#source-3`; accept that shape here
      # rather than relying only on the Apps Script rewrite.
      def self_link?(pre, page_url)
        pre = pre.to_s.strip
        return true if pre.empty?
        return false unless page_url

        path = pre.sub(%r{\Ahttps?://[^/]+}, "")
        norm = ->(s) { s.sub(%r{/\z}, "").sub(%r{/index\.html\z}, "") }
        norm.call(path) == norm.call(page_url)
      end

      def marker_run_html(run, ctx, count, path, lineno)
        nums = run.scan(/\[(\d{1,3})\]/).flatten.map(&:to_i)
        %(<sup class="source-ref-group">#{anchors(nums, ctx, count, path, lineno)}</sup>)
      end

      def rollup_html(run, ctx, count, path, lineno)
        nums = run.scan(/\[(\d{1,3})\]/).flatten.map(&:to_i)
        %(<p class="source-rollup"><span class="source-rollup-label">Sources:</span> ) +
          %(<span class="source-ref-group">#{anchors(nums, ctx, count, path, lineno)}</span></p>)
      end

      def anchors(nums, ctx, count, path, lineno)
        nums.map do |num|
          validate!(num, count, path, lineno)
          cite_id = ctx.register(num)
          %(<a class="chip source-ref" href="#source-#{num}" id="#{cite_id}" ) +
            %(data-source="#{num}" role="doc-noteref" aria-label="Source #{num}">#{num}</a>)
        end.join
      end

      # A dangling citation is a build failure, not a broken production link.
      def validate!(num, count, path, lineno)
        return if num >= 1 && num <= count

        raise Jekyll::Errors::FatalException,
              "SourceRefs: #{path}:#{lineno} cites [#{num}], but the source set " \
              "has #{count} entries (valid range 1–#{count})."
      end

      def plain_text(str)
        str.gsub(/!?\[((?:[^\[\]]|\[[^\[\]]*\])*)\]\((?:[^()]|\([^()]*\))*\)/) { Regexp.last_match(1) }
           .gsub(/[*_`]/, "")
           .strip
      end
    end
  end
end

# ---------------------------------------------------------------------------- #
# Entry point 1 — whole-file markdown (pages, posts).
# ---------------------------------------------------------------------------- #
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc, payload|
  next unless doc.data["sources"]

  site = doc.site
  Thrive65::SourceRefs.rewrite_page(doc, site, payload)
end

# ---------------------------------------------------------------------------- #
# Entry point 2 — Liquid filter for _data-driven content.
#
#   {{ item.answer | source_refs: item.question, "faq" }}
#
# Citations accumulate on the page drop, so `{% include sources.html %}` later in
# the same template sees them. (Liquid renders top-to-bottom, and the sources
# section is rendered after the accordion loop.)
# ---------------------------------------------------------------------------- #
module Thrive65
  module SourceRefsFilter
    def source_refs(text, section_label, set_key)
      site = @context.registers[:site]
      page = @context.registers[:page]
      items = Thrive65::SourceRefs.source_items(site, set_key, "(filter)")

      section = { "id" => "faq-#{Jekyll::Utils.slugify(section_label)}", "label" => section_label }
      store = (@context.registers[:source_refs] ||= {})
      ctx = (store[set_key] ||= Thrive65::SourceRefs::Context.new(section: section))
      ctx.pin(section)

      out = Thrive65::SourceRefs.rewrite(text, items.length, ctx, "(filter) #{section_label}")
      page["source_citations"] = ctx.citations
      out
    end
  end
end
Liquid::Template.register_filter(Thrive65::SourceRefsFilter)
