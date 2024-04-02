import throttle from 'lodash/throttle'
import debounce from 'lodash/debounce'

/**
 * synchronize the scroll position among `els`
 * @param  {DOM[]} els
 * @param  {Func}  callback(offsetLeft)
 * @return {Func}  unsync
 */
export default function (els, callback, isHorizontal) {
  let currentDriver

  function syncScroll(me, others) {

    var onScrollSync = throttle((e) => {
      // if (currentDriver && currentDriver !== me) return
      // currentDriver = me;

      let offsetLeft = me.scrollLeft
      let offsetTop = me.scrollTop

      for (var i = 0; i < others.length; i++) {
        if(isHorizontal == true)
        {
          others[i].scrollLeft = offsetLeft
        }
        if(isHorizontal == false)
        {
          others[i].scrollTop = offsetTop
        }
      }

      // callback(offsetLeft)
    })

    // var onScrollStop = debounce(() => {
    //   currentDriver = null
    // }, 150)

    // Syhncronize X/Y scroll when cursour is out of scroll area i.g on left fixed table
    // Base event behavior is prevented because caused scrolling of entire widndow
    function onWhell(e) {
      if(others != null && others.length > 0){
        var normalTableBody = others[0]

        var hasHorizontalScrollbar = normalTableBody.scrollWidth > normalTableBody.clientWidth
        var hasVerticalScrollbar = normalTableBody.scrollHeight > normalTableBody.clientHeight
      } else {
        e.preventDefault()
      }

      me.scrollTop += e.deltaY
      me.scrollLeft += e.deltaX
    }

    // Synchronize scroll between non scrollable (overflow: hidden) grid parts
    others.forEach(other => {
      other.addEventListener('mousewheel', onWhell)
    })


    me.addEventListener('scroll', onScrollSync)
    //me.addEventListener('scroll', onScrollStop)

    // unlistener
    return () => {
      me.removeEventListener('scroll', onScrollSync)
      //me.removeEventListener('scroll', onScrollStop)
      others.forEach(other => {
        other.removeEventListener('mousewheel', onWhell)
      })
    }
  }

  const unlisteners = els.map((me, idx) => {
    let others = els.slice()
    others.splice(idx, 1) // exclude me
    return syncScroll(me, others)
  })

  // unsync
  return () => {
    unlisteners.forEach(unlistener => {
      unlistener()
    })
  }
}
